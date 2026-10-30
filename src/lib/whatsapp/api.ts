import { WhatsAppConfig, Member } from '../db/types';

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  rawResponse?: Record<string, unknown>;
}

export async function sendWhatsAppMessage(
  recipientPhone: string,
  messageText: string,
  mediaUrl?: string,
  mediaType?: 'image' | 'video' | 'document' | 'none',
  config?: WhatsAppConfig
): Promise<WhatsAppSendResult> {
  const cleanPhone = recipientPhone.replace(/\D/g, '');

  // If real WhatsApp Cloud API credentials are provided and valid:
  if (
    config?.phoneNumberId &&
    config?.apiAccessToken &&
    !config.apiAccessToken.includes('mock_token')
  ) {
    try {
      const url = `https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`;
      
      let payload: Record<string, unknown> = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
      };

      if (mediaUrl && mediaType && mediaType !== 'none') {
        payload.type = mediaType;
        payload[mediaType] = {
          link: mediaUrl,
          caption: messageText
        };
      } else {
        payload.type = 'text';
        payload.text = { preview_url: true, body: messageText };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data?.error?.message || `WhatsApp API error (${res.status})`,
          rawResponse: data
        };
      }

      const messageId = data?.messages?.[0]?.id || `wamid.${Date.now()}`;
      return {
        success: true,
        messageId,
        rawResponse: data
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error contacting WhatsApp API'
      };
    }
  }

  // Live Simulation for Development / Sandbox
  // Generates genuine WhatsApp Cloud API Message ID format
  const mockMsgId = `wamid.HBgL${cleanPhone}U${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}QQA=`;
  return {
    success: true,
    messageId: mockMsgId,
    rawResponse: {
      messaging_product: 'whatsapp',
      contacts: [{ input: cleanPhone, wa_id: cleanPhone }],
      messages: [{ id: mockMsgId, message_status: 'accepted' }]
    }
  };
}

// Parses inbound webhook payloads from Meta
export function processInboundWebhook(
  payload: Record<string, unknown>,
  onOptOut: (phone: string, keyword: string) => void,
  onStatusUpdate: (wamid: string, status: 'sent' | 'delivered' | 'read' | 'failed', error?: string) => void
) {
  try {
    const entry = (payload?.entry as Record<string, unknown>[])?.[0];
    const changes = (entry?.changes as Record<string, unknown>[])?.[0];
    const value = changes?.value as Record<string, unknown>;

    // 1. Check for incoming user messages (e.g. STOP)
    const messages = value?.messages as Record<string, unknown>[];
    if (messages && messages.length > 0) {
      for (const msg of messages) {
        const from = msg.from as string;
        const textObj = msg.text as { body: string };
        const text = textObj?.body?.trim().toUpperCase();

        if (text && ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'OPTOUT'].includes(text)) {
          onOptOut(from, text);
        }
      }
    }

    // 2. Check for message delivery / read receipts
    const statuses = value?.statuses as Record<string, unknown>[];
    if (statuses && statuses.length > 0) {
      for (const st of statuses) {
        const id = st.id as string;
        const status = st.status as 'sent' | 'delivered' | 'read' | 'failed';
        const errors = st.errors as { message: string }[];
        const errorReason = errors?.[0]?.message;
        if (id && status) {
          onStatusUpdate(id, status, errorReason);
        }
      }
    }
  } catch (err) {
    console.error('Error processing inbound webhook:', err);
  }
}
