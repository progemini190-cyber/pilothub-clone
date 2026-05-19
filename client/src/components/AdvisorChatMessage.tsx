import { Streamdown } from "streamdown";
import type { ChatMessage } from "@/hooks/useAdvisorChat";

type AdvisorChatMessageProps = {
  msg: ChatMessage;
  logoUrl: string;
  userBubbleStyle: React.CSSProperties;
  assistantBubbleStyle: React.CSSProperties;
  logoFrameStyle: React.CSSProperties;
};

export function AdvisorChatMessage({
  msg,
  logoUrl,
  userBubbleStyle,
  assistantBubbleStyle,
  logoFrameStyle,
}: AdvisorChatMessageProps) {
  const showText =
    msg.content && (msg.role === "assistant" || msg.content !== "[Image attached]");

  return (
    <div className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
      {msg.role === "assistant" && (
        <div
          className="ph-logo-frame ph-logo-frame--nav w-7 h-7 rounded-lg flex-shrink-0 mt-1"
          style={logoFrameStyle}
        >
          <img src={logoUrl} alt="" className="ph-logo-frame__img rounded-md" />
        </div>
      )}
      <div
        className="max-w-[85%] sm:max-w-[75%] md:max-w-[65%] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl text-xs sm:text-sm leading-relaxed break-words"
        style={msg.role === "user" ? userBubbleStyle : assistantBubbleStyle}
      >
        {msg.imageData && (
          <img
            src={msg.imageData}
            alt="Attached"
            className="max-w-full rounded-lg mb-2 max-h-48 object-contain"
          />
        )}
        {msg.role === "assistant" ? (
          <Streamdown>{msg.content}</Streamdown>
        ) : (
          showText && <span>{msg.content}</span>
        )}
      </div>
    </div>
  );
}
