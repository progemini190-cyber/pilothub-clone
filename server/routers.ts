import { ENV } from "./_core/env";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, approvedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { invokeAdvisorLLM } from "./llmWithApiKey";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import { sendApprovalEmail as sendApprovalEmailHelper, sendPaymentConfirmationEmail } from "./emailHelper";

const COOKIE_NAME = "app_session_id";

function requireAdmin(ctx: { req: { cookies?: Record<string, string> }; user?: { role?: string } | null }) {
  // Accept either: legacy admin_session cookie OR logged-in user with role='admin'
  const hasAdminCookie = ctx.req.cookies?.admin_session === "authenticated";
  const hasAdminRole = ctx.user?.role === "admin";
  if (!hasAdminCookie && !hasAdminRole) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin access required" });
  }
}

// ── Email helper (uses Manus notification + owner email) ──
async function sendApprovalEmail(userEmail: string, userName: string, plan: string) {
  // Try to send email via Gmail SMTP
  const loginUrl = "https://pilothub.vip";
  const sent = await sendApprovalEmailHelper({ to: userEmail, name: userName, plan, loginUrl });
  if (!sent) {
    // Fallback: notify owner to send manually
    await notifyOwner({
      title: `✅ New User Approved: ${userName}`,
      content: `User ${userName} (${userEmail}) has been approved.\n\nPlease send welcome email to ${userEmail}\nLogin URL: ${loginUrl}`,
    });
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(1).optional(),
        phone: z.string().optional(),
        businessName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, {
          name: input.name,
          phone: input.phone,
          businessName: input.businessName,
        });
        return { success: true };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Application submission (public, no login required) ──
  applications: router({
    submit: publicProcedure
      .input(z.object({
        fullName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        businessName: z.string().optional(),
        businessType: z.string().optional(),
        useCase: z.string().optional(),
        plan: z.enum(["bizpilot", "founderpilot", "free"]).optional().default("free"),
      }))
      .mutation(async ({ input }) => {
        const app = await db.createApplication({
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          businessName: input.businessName,
          businessType: input.businessType,
          useCase: input.useCase,
          plan: input.plan,
          source: "website",
        });
        // Notify admin
        try {
          await notifyOwner({
            title: `📋 New Application: ${input.fullName}`,
            content: `New application from ${input.fullName} (${input.email})\nPlan: ${input.plan}\nBusiness: ${input.businessName ?? "N/A"}\nUse case: ${input.useCase ?? "N/A"}`,
          });
        } catch (e) { /* non-blocking */ }
        return { success: true, applicationId: app.id };
      }),
  }),

  // ── AI chat and conversation routers ──
  ai: router({
    conversations: router({
      list: approvedProcedure
        .input(z.object({ modelSlug: z.enum(["bizpilot", "founderpilot"]) }))
        .query(async ({ ctx, input }) => {
          const convs = await db.listUserConversations(ctx.user.id, input.modelSlug);
          return { conversations: convs };
        }),
      get: approvedProcedure
        .input(z.object({ conversationId: z.number() }))
        .query(async ({ ctx, input }) => {
          const conv = await db.getConversationById(ctx.user.id, input.conversationId);
          if (!conv) throw new TRPCError({ code: "NOT_FOUND" });
          const msgs = await db.listConversationMessages(input.conversationId);
          return { conversation: conv, messages: msgs };
        }),
      create: approvedProcedure
        .input(z.object({ modelSlug: z.enum(["bizpilot", "founderpilot"]), title: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
          const conv = await db.getOrCreateConversation({ userId: ctx.user.id, modelSlug: input.modelSlug, title: input.title });
          return { conversation: conv };
        }),
      delete: approvedProcedure
        .input(z.object({ conversationId: z.number() }))
        .mutation(async ({ ctx, input }) => {
          const conv = await db.getConversationById(ctx.user.id, input.conversationId);
          if (!conv) throw new TRPCError({ code: "NOT_FOUND" });
          await db.deleteConversation(input.conversationId, ctx.user.id);
          return { success: true };
        }),
    }),

    freeCounts: approvedProcedure.query(async ({ ctx }) => {
      return await db.getFreeTrialCounts(ctx.user.id);
    }),

    // Get message usage for both advisors (for UI counter)
    messageUsage: approvedProcedure.query(async ({ ctx }) => {
      const biz = await db.getMessageUsage(ctx.user.id, "bizpilot");
      const founder = await db.getMessageUsage(ctx.user.id, "founderpilot");
      return { biz, founder };
    }),

    bizpilot: approvedProcedure
      .input(z.object({ message: z.string().min(1).max(10000), conversationId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        // ── Tiered message limit check ──
        const usage = await db.getMessageUsage(user.id, "bizpilot");
        if (usage.used >= usage.limit) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: JSON.stringify({
              code: "MESSAGE_LIMIT_REACHED",
              advisor: "bizpilot",
              planType: usage.planType,
              used: usage.used,
              limit: usage.limit,
              hasUsedStarter: usage.hasUsedStarter,
            }),
          });
        }
        const conv = await db.getOrCreateConversation({ userId: user.id, modelSlug: "bizpilot", conversationId: input.conversationId });
        await db.createMessage({ conversationId: conv.id, role: "user", content: input.message });
        const history = await db.listConversationMessages(conv.id);
        const recentHistory = history.slice(-20);
        const systemPrompt = await db.getActiveSystemPrompt("bizpilot");
        const fullUser = await db.getUserById(user.id);
        const userProfileLines = [
          `\n\n[User Profile]`,
          `- Name: ${fullUser?.name ?? user.name ?? "Unknown"}`,
          fullUser?.businessName ? `- Business Name: ${fullUser.businessName}` : null,
          (fullUser as any)?.businessType ? `- Business Type: ${(fullUser as any).businessType}` : null,
          (fullUser as any)?.useCase ? `- How they use PilotHub: ${(fullUser as any).useCase}` : null,
          `- Plan: ${usage.planType}`,
        ].filter(Boolean);
        const userProfileCtx = userProfileLines.join("\n");
        const olderHistory = history.slice(0, Math.max(0, history.length - 21));
        const memoryNote = olderHistory.length > 0
          ? `\n\n[Conversation Memory: ${history.length} total messages. Earlier: ${olderHistory.slice(-5).map(m => `${m.role === "user" ? "User" : "AI"}: ${m.content.slice(0, 120)}`).join(" | ")}]`
          : "";
        const llmMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: (systemPrompt || "You are BizPilot, an expert business advisor for Myanmar businesses.") + userProfileCtx + memoryNote },
          ...recentHistory.slice(0, -1).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
          { role: "user", content: input.message },
        ];
        const assistantMessage = await invokeAdvisorLLM("bizpilot", llmMessages);
        await db.createMessage({ conversationId: conv.id, role: "assistant", content: assistantMessage });
        await db.touchConversation(conv.id);
        if (history.length <= 1) await db.updateConversationTitle(conv.id, input.message.slice(0, 80));
        // Increment message counter
        await db.incrementMessageUsed(user.id, "bizpilot");
        const newUsage = await db.getMessageUsage(user.id, "bizpilot");
        return { conversationId: conv.id, message: assistantMessage, usage: newUsage };
      }),

    founderpilot: approvedProcedure
      .input(z.object({ message: z.string().min(1).max(10000), conversationId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        // ── Tiered message limit check ──
        const usage = await db.getMessageUsage(user.id, "founderpilot");
        if (usage.used >= usage.limit) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: JSON.stringify({
              code: "MESSAGE_LIMIT_REACHED",
              advisor: "founderpilot",
              planType: usage.planType,
              used: usage.used,
              limit: usage.limit,
              hasUsedStarter: usage.hasUsedStarter,
            }),
          });
        }
        const conv = await db.getOrCreateConversation({ userId: user.id, modelSlug: "founderpilot", conversationId: input.conversationId });
        await db.createMessage({ conversationId: conv.id, role: "user", content: input.message });
        const history = await db.listConversationMessages(conv.id);
        const recentHistory = history.slice(-20);
        const systemPrompt = await db.getActiveSystemPrompt("founderpilot");
        const fullUser = await db.getUserById(user.id);
        const userProfileLines = [
          `\n\n[User Profile]`,
          `- Name: ${fullUser?.name ?? user.name ?? "Unknown"}`,
          fullUser?.businessName ? `- Business Name: ${fullUser.businessName}` : null,
          (fullUser as any)?.businessType ? `- Business Type: ${(fullUser as any).businessType}` : null,
          (fullUser as any)?.useCase ? `- How they use PilotHub: ${(fullUser as any).useCase}` : null,
          `- Plan: ${usage.planType}`,
        ].filter(Boolean);
        const userProfileCtx = userProfileLines.join("\n");
        const olderHistory = history.slice(0, Math.max(0, history.length - 21));
        const memoryNote = olderHistory.length > 0
          ? `\n\n[Conversation Memory: ${history.length} total messages. Earlier: ${olderHistory.slice(-5).map(m => `${m.role === "user" ? "User" : "AI"}: ${m.content.slice(0, 120)}`).join(" | ")}]`
          : "";
        const llmMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: (systemPrompt || "You are FounderPilot, a strategic advisor for founders and CEOs.") + userProfileCtx + memoryNote },
          ...recentHistory.slice(0, -1).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
          { role: "user", content: input.message },
        ];
        const assistantMessage = await invokeAdvisorLLM("founderpilot", llmMessages);
        await db.createMessage({ conversationId: conv.id, role: "assistant", content: assistantMessage });
        await db.touchConversation(conv.id);
        if (history.length <= 1) await db.updateConversationTitle(conv.id, input.message.slice(0, 80));
        // Increment message counter
        await db.incrementMessageUsed(user.id, "founderpilot");
        const newUsage = await db.getMessageUsage(user.id, "founderpilot");
        return { conversationId: conv.id, message: assistantMessage, usage: newUsage };
      }),
  }),

  // ── Payment submission ──
  payments: router({
    // Get payment settings (phone, QR) for display
    settings: publicProcedure.query(async () => {
      // Per-method settings
      const kbzpayPhone = await db.getSystemSetting("kbzpay_phone");
      const kbzpayName = await db.getSystemSetting("kbzpay_name");
      const kbzpayQr = await db.getSystemSetting("kbzpay_qr_url");
      const wavepayPhone = await db.getSystemSetting("wavepay_phone");
      const wavepayName = await db.getSystemSetting("wavepay_name");
      const wavepayQr = await db.getSystemSetting("wavepay_qr_url");
      const ayapayPhone = await db.getSystemSetting("ayapay_phone");
      const ayapayName = await db.getSystemSetting("ayapay_name");
      const ayapayQr = await db.getSystemSetting("ayapay_qr_url");
      // Legacy fallback
      const phone = await db.getSystemSetting("payment_phone");
      const qrUrl = await db.getSystemSetting("payment_qr_url");
      const kpayName = await db.getSystemSetting("payment_kpay_name");
      return {
        phone, qrUrl, kpayName,
        kbzpay: { phone: kbzpayPhone, name: kbzpayName, qrUrl: kbzpayQr },
        wavepay: { phone: wavepayPhone, name: wavepayName, qrUrl: wavepayQr },
        ayapay: { phone: ayapayPhone, name: ayapayName, qrUrl: ayapayQr },
      };
    }),

    submit: protectedProcedure
      .input(z.object({
        plan: z.enum(["bizpilot", "founderpilot", "bizpilot-starter", "bizpilot-pro", "founderpilot-starter", "founderpilot-pro"]),
        paymentMethod: z.string(),
        transactionRef: z.string().optional(),
        screenshotUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const amounts: Record<string, number> = {
          "bizpilot": 100000, "founderpilot": 300000,
          "bizpilot-starter": 20000, "bizpilot-pro": 100000,
          "founderpilot-starter": 40000, "founderpilot-pro": 300000,
        };
        const payment = await db.createPayment({
          userId: ctx.user.id,
          userName: ctx.user.name ?? undefined,
          userEmail: ctx.user.email ?? undefined,
          plan: input.plan,
          amount: amounts[input.plan] ?? 0,
          paymentMethod: input.paymentMethod,
          transactionRef: input.transactionRef,
          screenshotUrl: input.screenshotUrl,
          source: "website",
        });
        // Notify admin
        try {
          await notifyOwner({
            title: `💰 New Payment: ${ctx.user.name} - ${input.plan}`,
            content: `Payment submitted by ${ctx.user.name} (${ctx.user.email})\nPlan: ${input.plan}\nMethod: ${input.paymentMethod}\nRef: ${input.transactionRef ?? "N/A"}`,
          });
        } catch (e) { /* non-blocking */ }
        return { success: true, paymentId: payment.id };
      }),

    // Upload screenshot
    uploadScreenshot: protectedProcedure
      .input(z.object({
        filename: z.string(),
        contentType: z.string(),
        dataBase64: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.dataBase64, "base64");
        const key = `payment-screenshots/${ctx.user.id}-${Date.now()}-${input.filename}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url };
      }),

    myPayments: protectedProcedure.query(async ({ ctx }) => {
      const userPayments = await db.listUserPayments(ctx.user.id);
      return { payments: userPayments };
    }),
  }),

  // ── Admin router ──
  admin: router({
    login: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const adminUser = process.env.ADMIN_USERNAME || "admin";
        const adminPass = process.env.ADMIN_PASSWORD || "pilothub2026";
        if (input.username !== adminUser || input.password !== adminPass) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie("admin_session", "authenticated", { ...cookieOptions, maxAge: 60 * 60 * 8 * 1000 });
        return { success: true };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("admin_session", { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),

    isAuthenticated: publicProcedure.query(({ ctx }) => {
      const hasAdminCookie = ctx.req.cookies?.admin_session === "authenticated";
      const hasAdminRole = ctx.user?.role === "admin";
      return { authenticated: hasAdminCookie || hasAdminRole };
    }),

    // ── System Settings ──
    settings: router({
      list: publicProcedure.query(async ({ ctx }) => {
        requireAdmin(ctx);
        return await db.listSystemSettings();
      }),
      set: publicProcedure
        .input(z.object({ key: z.string(), value: z.string() }))
        .mutation(async ({ ctx, input }) => {
          requireAdmin(ctx);
          await db.setSystemSetting(input.key, input.value);
          return { success: true };
        }),
      // Upload QR code image (supports per-method: kbzpay, wavepay, ayapay)
      uploadQr: publicProcedure
        .input(z.object({
          filename: z.string(),
          contentType: z.string(),
          dataBase64: z.string(),
          method: z.enum(["kbzpay", "wavepay", "ayapay", "default"]).optional().default("default"),
        }))
        .mutation(async ({ ctx, input }) => {
          requireAdmin(ctx);
          const buffer = Buffer.from(input.dataBase64, "base64");
          const key = `payment-qr/${input.method}-${Date.now()}-${input.filename}`;
          const { url } = await storagePut(key, buffer, input.contentType);
          const settingKey = input.method === "default" ? "payment_qr_url" : `${input.method}_qr_url`;
          await db.setSystemSetting(settingKey, url);
          return { success: true, url };
        }),
    }),

    // ── Applications management ──
    applications: router({
      list: publicProcedure.query(async ({ ctx }) => {
        requireAdmin(ctx);
        const apps = await db.listAllApplications();
        return { applications: apps };
      }),
      approve: publicProcedure
        .input(z.object({ applicationId: z.number(), notes: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
          requireAdmin(ctx);
          const app = await db.getApplicationById(input.applicationId);
          if (!app) throw new TRPCError({ code: "NOT_FOUND" });
          // Create user account for this applicant
          const { nanoid } = await import("nanoid");
          const openId = `app_${nanoid(16)}`;
          await db.upsertUser({
            openId,
            name: app.fullName,
            email: app.email,
            loginMethod: "application",
            lastSignedIn: new Date(),
            status: "active",
          } as any);
          // Copy application profile data to user account
          const createdUser = await db.getUserByOpenId(openId);
          if (createdUser) {
            await db.updateUserProfile(createdUser.id, {
              businessName: app.businessName ?? undefined,
              businessType: app.businessType ?? undefined,
              useCase: app.useCase ?? undefined,
            });
          }
          const user = await db.getUserByOpenId(openId);
          if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
          // Set plan to free (they need to pay to upgrade)
          await db.updateApplicationStatus(app.id, "approved", user.id, input.notes);
          // Send approval email to applicant via Gmail SMTP
          if (app.email) {
            try {
              await sendApprovalEmail(app.email, app.fullName, app.plan ?? "free");
            } catch (e) { /* non-blocking */ }
          }
          return { success: true, userId: user.id, openId };
        }),
      reject: publicProcedure
        .input(z.object({ applicationId: z.number(), notes: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
          requireAdmin(ctx);
          await db.updateApplicationStatus(input.applicationId, "rejected", undefined, input.notes);
          return { success: true };
        }),
    }),

    // ── User management ──
    users: router({
      list: publicProcedure.query(async ({ ctx }) => {
        requireAdmin(ctx);
        const users = await db.listAllUsers();
        return { users };
      }),
      updateRole: publicProcedure
        .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
        .mutation(async ({ ctx, input }) => {
          requireAdmin(ctx);
          await db.updateUserRole(input.userId, input.role);
          return { success: true };
        }),
      updateSubscription: publicProcedure
        .input(z.object({ userId: z.number(), plan: z.string(), status: z.string() }))
        .mutation(async ({ ctx, input }) => {
          requireAdmin(ctx);
          await db.updateUserSubscription(input.userId, input.plan, input.status);
          return { success: true };
        }),
      generate: publicProcedure
        .input(z.object({ name: z.string().min(1), email: z.string().email(), plan: z.enum(["bizpilot", "founderpilot"]).optional(), businessName: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
          requireAdmin(ctx);
          const { nanoid } = await import("nanoid");
          const openId = `ext_${nanoid(16)}`;
          const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
          const generatedPassword = Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
          await db.upsertUser({ openId, name: input.name, email: input.email, loginMethod: "admin_generated", lastSignedIn: new Date() });
          const user = await db.getUserByOpenId(openId);
          if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
          if (input.plan) await db.updateUserSubscription(user.id, input.plan, "active");
          return { success: true, userId: user.id, openId, name: input.name, email: input.email, plan: input.plan || null, generatedPassword };
        }),
      delete: publicProcedure
        .input(z.object({ userId: z.number() }))
        .mutation(async ({ ctx, input }) => {
          requireAdmin(ctx);
          await db.deleteUser(input.userId);
          return { success: true };
        }),
    }),

    // ── Payment management ──
    payments: router({
      list: publicProcedure.query(async ({ ctx }) => {
        requireAdmin(ctx);
        const payments = await db.listAllPayments();
        return { payments };
      }),
      updateStatus: publicProcedure
        .input(z.object({ paymentId: z.number(), status: z.enum(["pending", "confirmed", "rejected"]) }))
        .mutation(async ({ ctx, input }) => {
          requireAdmin(ctx);
          await db.updatePaymentStatus(input.paymentId, input.status);
          if (input.status === "confirmed") {
            const allPayments = await db.listAllPayments();
            const payment = allPayments.find(p => p.id === input.paymentId);
            if (payment?.userId != null) {
              // Determine plan type from payment plan string
              // e.g. "bizpilot-starter", "bizpilot-pro", "bizpilot", "founderpilot-starter", "founderpilot-pro", "founderpilot"
              const planStr = payment.plan ?? "";
              const advisor = planStr.includes("founder") ? "founderpilot" : "bizpilot";
              const planType = planStr.includes("starter") ? "starter" : "pro";
              // Activate tiered plan (sets limits, resets counter)
              await db.activateTieredPlan(payment.userId, advisor, planType);
              // Also update legacy plan field
              await db.updateUserSubscription(payment.userId, payment.plan, "active");
              // Send confirmation email to user via Gmail SMTP
              if (payment.userEmail) {
                try {
                  const sent = await sendPaymentConfirmationEmail({
                    to: payment.userEmail,
                    name: payment.userName ?? "User",
                    plan: payment.plan,
                  });
                  if (!sent) {
                    await notifyOwner({
                      title: `💳 Payment Confirmed: ${payment.userName ?? "User"} - ${payment.plan}`,
                      content: `Payment confirmed for ${payment.userName} (${payment.userEmail})\nPlan: ${payment.plan}\nAmount: ${payment.amount} MMK\n\nEmail not sent (no GMAIL credentials). Please send manually to ${payment.userEmail}`,
                    });
                  }
                } catch (e) { /* non-blocking */ }
              }
            }
          }
          return { success: true };
        }),
      update: publicProcedure
        .input(z.object({
          paymentId: z.number(),
          plan: z.string().optional(),
          amount: z.number().optional(),
          status: z.enum(["pending", "confirmed", "rejected"]).optional(),
          paymentMethod: z.string().optional(),
          transactionRef: z.string().optional(),
          notes: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          requireAdmin(ctx);
          const { paymentId, ...fields } = input;
          await db.updatePayment(paymentId, fields);
          if (fields.status === "confirmed" || fields.plan) {
            const allPayments = await db.listAllPayments();
            const payment = allPayments.find(p => p.id === paymentId);
            if (payment && payment.status === "confirmed" && payment.userId != null) {
              const planStr = payment.plan ?? "";
              const advisor = planStr.includes("founder") ? "founderpilot" : "bizpilot";
              const planType = planStr.includes("starter") ? "starter" : "pro";
              await db.activateTieredPlan(payment.userId, advisor, planType);
              await db.updateUserSubscription(payment.userId, payment.plan, "active");
            }
          }
          return { success: true };
        }),
      delete: publicProcedure
        .input(z.object({ paymentId: z.number() }))
        .mutation(async ({ ctx, input }) => {
          requireAdmin(ctx);
          await db.deletePayment(input.paymentId);
          return { success: true };
        }),
    }),

    // ── System Prompt management ──
    prompts: router({
      list: publicProcedure.query(async ({ ctx }) => {
        requireAdmin(ctx);
        const prompts = await db.listSystemPrompts();
        return { prompts };
      }),
      getActive: publicProcedure
        .input(z.object({ modelSlug: z.enum(["bizpilot", "founderpilot"]) }))
        .query(async ({ ctx, input }) => {
          requireAdmin(ctx);
          const content = await db.getActiveSystemPrompt(input.modelSlug);
          return { content };
        }),
      save: publicProcedure
        .input(z.object({ name: z.string().min(1), modelSlug: z.enum(["bizpilot", "founderpilot"]), content: z.string().min(10), activate: z.boolean().default(false) }))
        .mutation(async ({ ctx, input }) => {
          requireAdmin(ctx);
          const result = await db.createSystemPromptVersion({ name: input.name, modelSlug: input.modelSlug, content: input.content, activate: input.activate });
          return { success: true, promptId: result.id };
        }),
      activate: publicProcedure
        .input(z.object({ promptId: z.number(), modelSlug: z.string() }))
        .mutation(async ({ ctx, input }) => {
          requireAdmin(ctx);
          await db.activateSystemPrompt(input.promptId, input.modelSlug);
          return { success: true };
        }),
    }),

    // ── API Key management ──
    apiKeys: router({
      list: publicProcedure.query(async ({ ctx }) => {
        requireAdmin(ctx);
        const keys = await db.listAllApiKeys();
        return { keys };
      }),
      upsert: publicProcedure
        .input(z.object({ provider: z.enum(["openai", "gemini"]), keyValue: z.string().min(10) }))
        .mutation(async ({ ctx, input }) => {
          requireAdmin(ctx);
          await db.upsertApiKey(input.provider, input.keyValue);
          return { success: true };
        }),
      setActive: publicProcedure
        .input(z.object({ keyId: z.number(), provider: z.string() }))
        .mutation(async ({ ctx, input }) => {
          requireAdmin(ctx);
          await db.setApiKeyActive(input.keyId, input.provider);
          return { success: true };
        }),
      delete: publicProcedure
        .input(z.object({ keyId: z.number() }))
        .mutation(async ({ ctx, input }) => {
          requireAdmin(ctx);
          await db.deleteApiKey(input.keyId);
          return { success: true };
        }),
    }),

    // ── AI Model management ──
    models: router({
      list: publicProcedure.query(async ({ ctx }) => {
        requireAdmin(ctx);
        const models = await db.listAllAiModels();
        return { models };
      }),
      update: publicProcedure
        .input(z.object({ targetRole: z.enum(["bizpilot", "founderpilot"]), modelString: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
          requireAdmin(ctx);
          await db.updateAiModel(input.targetRole, input.modelString);
          return { success: true };
        }),
    }),

    // ── Announcements management ──
    announcements: router({
      list: publicProcedure.query(async ({ ctx }) => {
        requireAdmin(ctx);
        const items = await db.listAnnouncements(false);
        return { announcements: items };
      }),
      create: publicProcedure
        .input(z.object({
          title: z.string().min(1),
          content: z.string().min(1),
          type: z.enum(["info", "success", "warning", "urgent"]).default("info"),
        }))
        .mutation(async ({ ctx, input }) => {
          requireAdmin(ctx);
          const result = await db.createAnnouncement(input);
          return { success: true, id: result.id };
        }),
      toggle: publicProcedure
        .input(z.object({ id: z.number(), isActive: z.enum(["true", "false"]) }))
        .mutation(async ({ ctx, input }) => {
          requireAdmin(ctx);
          await db.updateAnnouncement(input.id, { isActive: input.isActive });
          return { success: true };
        }),
      delete: publicProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
          requireAdmin(ctx);
          await db.deleteAnnouncement(input.id);
          return { success: true };
        }),
    }),

    // ── External API Token management ──
    externalTokens: router({
      list: publicProcedure.query(async ({ ctx }) => {
        requireAdmin(ctx);
        return await db.listExternalApiTokens();
      }),
      create: publicProcedure
        .input(z.object({ name: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
          requireAdmin(ctx);
          const { nanoid } = await import("nanoid");
          const token = `ph_ext_${nanoid(32)}`;
          const result = await db.createExternalApiToken(input.name, token);
          return { success: true, id: result.id, token };
        }),
      delete: publicProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
          requireAdmin(ctx);
          await db.deleteExternalApiToken(input.id);
          return { success: true };
        }),
    }),
  }),

  // ── User-facing announcements (active only) ──
  announcements: router({
    list: publicProcedure.query(async () => {
      const items = await db.listAnnouncements(true);
      return { announcements: items };
    }),
  }),
});

export type AppRouter = typeof appRouter;
