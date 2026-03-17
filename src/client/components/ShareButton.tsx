import React, { useState, useCallback } from "react";
import { useI18n } from "../context/I18nContext";

interface ShareButtonProps {
  permalink: string;
  disabled?: boolean;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ permalink, disabled }) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(async () => {
    if (disabled || !permalink) return;
    try {
      await navigator.clipboard.writeText(permalink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const ta = document.createElement("textarea");
      ta.value = permalink;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [permalink, disabled]);

  return (
    <button
      className={`share-button${copied ? " share-button--copied" : ""}`}
      onClick={handleClick}
      disabled={disabled}
      title={t("share.title")}
    >
      <span>{copied ? "✓" : "🔗"}</span>
      <span>{copied ? t("share.copied") : t("deck.share")}</span>
    </button>
  );
};
