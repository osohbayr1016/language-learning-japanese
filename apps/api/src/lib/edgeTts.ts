export function escapeXmlForSsml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
export function jaSsmlBody(text: string, speed: "normal" | "slow") {
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP"><voice name="ja-JP-NanamiNeural"><prosody rate="${speed === "slow" ? "-30%" : "0%"}">${escapeXmlForSsml(text.trim())}</prosody></voice></speak>`;
}
export async function fetchEdgeTTS(
  ssml: string,
  config?: { SPEECH_KEY?: string; SPEECH_REGION?: string },
): Promise<ArrayBuffer | null> {
  if (
    !config?.SPEECH_KEY ||
    !config.SPEECH_REGION ||
    !/^[a-z0-9-]+$/.test(config.SPEECH_REGION)
  )
    return null;
  const response = await fetch(
    `https://${config.SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
        "Ocp-Apim-Subscription-Key": config.SPEECH_KEY,
      },
      body: ssml,
      signal: AbortSignal.timeout(12000),
    },
  );
  if (
    !response.ok ||
    !response.headers.get("Content-Type")?.startsWith("audio/")
  )
    return null;
  const bytes = await response.arrayBuffer();
  return bytes.byteLength > 100 ? bytes : null;
}
