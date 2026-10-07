/**
 * Client Device Fingerprinting & Telemetry
 * 
 * Provides deterministic non-invasive hardware/browser entropy binding:
 * - Binds refresh sessions to browser characteristics
 * - Detects token hijacking across different devices or networks
 */

let cachedFingerprint: string | null = null;

/**
 * 32-bit FNV-1a fast non-cryptographic string hash.
 */
function fnv1a(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

export function getDeviceFingerprint(): string {
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  try {
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const language = navigator.language || "en-US";
    const platform = navigator.platform || "unknown";
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const userAgent = navigator.userAgent || "";

    const rawEntropy = [
      screenInfo,
      timezone,
      language,
      platform,
      hardwareConcurrency,
      userAgent.substring(0, 80),
    ].join("###");

    cachedFingerprint = `dfp_${fnv1a(rawEntropy)}`;
  } catch {
    cachedFingerprint = "dfp_fallback_web_portal";
  }

  return cachedFingerprint;
}

export function getDevicePlatform(): string {
  return "web";
}

export function getDeviceInfo(): { deviceId: string; deviceName: string } {
  const fp = getDeviceFingerprint();
  const ua = navigator.userAgent;
  let browserName = "Web Browser";

  if (ua.includes("Chrome") && !ua.includes("Edg")) {
    browserName = "Chrome Web";
  } else if (ua.includes("Firefox")) {
    browserName = "Firefox Web";
  } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
    browserName = "Safari Web";
  } else if (ua.includes("Edg")) {
    browserName = "Edge Web";
  }

  return {
    deviceId: fp,
    deviceName: `Pinak Portal (${browserName})`,
  };
}
