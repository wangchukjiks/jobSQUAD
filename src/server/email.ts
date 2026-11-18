import { Resend } from 'resend';
import { escapeHtml } from './security.ts';
import { saveContactInquiry } from './store.ts';

export interface ContactEmailPayload {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface ContactDeliveryResult {
  delivered: boolean;
  saved: boolean;
  deliveredTo?: string;
  sandboxForwarded?: boolean;
  messageId?: string;
  note?: string;
}

export async function sendContactEmail(
  payload: ContactEmailPayload
): Promise<ContactDeliveryResult> {
  saveContactInquiry(payload);

  const apiKey = process.env.RESEND_API_KEY;
  const sender = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
  const adminRecipient = 'jigsonbusyness@gmail.com';

  const deliverWithResend = async (
    recipient: string,
    replyTo: string,
    subject: string,
    buildHtml: (sandboxNote?: string) => string,
    intendedRecipientLabel: string
  ): Promise<ContactDeliveryResult> => {
    const apiKey = process.env.RESEND_API_KEY;
    const sender = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

    if (!apiKey || apiKey === 'MY_RESEND_API_KEY') {
      return {
        delivered: false,
        saved: true,
        note: 'Inquiry saved locally. RESEND_API_KEY is not configured for outbound email delivery.',
      };
    }

    try {
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({
        from: `JobSQUAD Contact <${sender}>`,
        to: [recipient],
        replyTo,
        subject,
        html: buildHtml(),
      });

      if (!error) {
        return {
          delivered: true,
          saved: true,
          deliveredTo: recipient,
          messageId: data?.id,
        };
      }

      const sandboxMatch = error.message?.match(/own email address \(([^)]+@[^)]+)\)/i);
      if (sandboxMatch && sandboxMatch[1]) {
        const verifiedOwnerEmail = sandboxMatch[1].trim();
        const retry = await resend.emails.send({
          from: `JobSQUAD Contact <${sender}>`,
          to: [verifiedOwnerEmail],
          replyTo,
          subject,
          html: buildHtml(
            `Resend testing mode note: Intended recipient was ${intendedRecipientLabel}. Verify a domain at resend.com/domains to deliver directly to ${intendedRecipientLabel}.`
          ),
        });

        if (!retry.error) {
          return {
            delivered: true,
            saved: true,
            deliveredTo: verifiedOwnerEmail,
            sandboxForwarded: true,
            messageId: retry.data?.id,
            note: `Email delivered to verified Resend inbox (${verifiedOwnerEmail}). Verify a sending domain in Resend to route directly to ${recipient}.`,
          };
        }
      }

      console.warn('Resend delivery failed:', error.message);
      return {
        delivered: false,
        saved: true,
        note: error.message || 'Email provider rejected outbound delivery.',
      };
    } catch (err) {
      console.warn('Resend exception:', err);
      return {
        delivered: false,
        saved: true,
        note: err instanceof Error ? err.message : 'Unable to reach email delivery service.',
      };
    }
  };

  return deliverWithResend(
    adminRecipient,
    payload.email,
    `[JobSQUAD Contact] ${payload.subject}`,
    (sandboxNote?: string) => {
      const safeName = escapeHtml(payload.name);
      const safeEmail = escapeHtml(payload.email);
      const safePhone = escapeHtml(payload.phone || 'Not provided');
      const safeSubject = escapeHtml(payload.subject);
      const safeMessage = escapeHtml(payload.message).replace(/\n/g, '<br />');
      return `
        <div style="font-family: sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #061B3A; border-bottom: 2px solid #D9A438; padding-bottom: 8px;">New Contact Inquiry — JobSQUAD</h2>
          ${sandboxNote ? `<p style="background:#fef3c7;color:#92400e;padding:10px 12px;border-radius:6px;font-size:13px;">${escapeHtml(sandboxNote)}</p>` : ''}
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Mobile:</strong> ${safePhone}</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <div style="margin-top: 16px; padding: 14px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            ${safeMessage}
          </div>
        </div>
      `;
    },
    adminRecipient
  );
}

export interface ListingInquiryEmailPayload {
  ownerEmail: string;
  ownerName: string;
  listingTitle: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  message: string;
}

export async function sendListingInquiryEmail(
  payload: ListingInquiryEmailPayload
): Promise<ContactDeliveryResult> {
  saveContactInquiry({
    name: payload.senderName,
    email: payload.senderEmail,
    phone: payload.senderPhone,
    subject: `[Listing Inquiry -> ${payload.ownerEmail}] ${payload.listingTitle}`,
    message: payload.message,
  });

  const apiKey = process.env.RESEND_API_KEY;
  const sender = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

  if (!apiKey || apiKey === 'MY_RESEND_API_KEY') {
    return {
      delivered: false,
      saved: true,
      note: 'Inquiry saved locally. RESEND_API_KEY is not configured for outbound email delivery.',
    };
  }

  const buildHtml = (sandboxNote?: string) => {
    const safeOwner = escapeHtml(payload.ownerName);
    const safeTitle = escapeHtml(payload.listingTitle);
    const safeSender = escapeHtml(payload.senderName);
    const safeEmail = escapeHtml(payload.senderEmail);
    const safePhone = escapeHtml(payload.senderPhone || 'Not provided');
    const safeMessage = escapeHtml(payload.message).replace(/\n/g, '<br />');
    return `
      <div style="font-family: sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #061B3A; border-bottom: 2px solid #D9A438; padding-bottom: 8px;">New Listing Inquiry — JobSQUAD</h2>
        ${sandboxNote ? `<p style="background:#fef3c7;color:#92400e;padding:10px 12px;border-radius:6px;font-size:13px;">${escapeHtml(sandboxNote)}</p>` : ''}
        <p><strong>Listing:</strong> ${safeTitle}</p>
        <p><strong>Owner / Seller:</strong> ${safeOwner} (${escapeHtml(payload.ownerEmail)})</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0;" />
        <p><strong>From:</strong> ${safeSender}</p>
        <p><strong>Reply Email:</strong> ${safeEmail}</p>
        <p><strong>Sender Mobile:</strong> ${safePhone}</p>
        <div style="margin-top: 16px; padding: 14px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          ${safeMessage}
        </div>
      </div>
    `;
  };

  const sendViaResend = async (targetEmail: string, sandboxNote?: string) => {
    const resend = new Resend(apiKey);
    return resend.emails.send({
      from: `JobSQUAD <${sender}>`,
      to: [targetEmail],
      replyTo: payload.senderEmail,
      subject: `[JobSQUAD] Inquiry about "${payload.listingTitle}"`,
      html: buildHtml(sandboxNote),
    });
  };

  try {
    const { data, error } = await sendViaResend(payload.ownerEmail);

    if (!error) {
      return {
        delivered: true,
        saved: true,
        deliveredTo: payload.ownerEmail,
        messageId: data?.id,
      };
    }

    const sandboxNoteText = `Resend testing mode note: Intended recipient was ${payload.ownerName} <${payload.ownerEmail}>. Verify a domain at resend.com/domains to deliver directly to any listing owner.`;
    const sandboxMatch = error.message?.match(/own email address \(([^)]+@[^)]+)\)/i);
    const isExampleOrSandbox =
      Boolean(sandboxMatch?.[1]) ||
      /example\.(com|org|net)|testing email address|verify a domain/i.test(error.message || '');

    if (isExampleOrSandbox) {
      let fallbackEmail = sandboxMatch?.[1]?.trim() || 'jigsonbusyness@gmail.com';
      let retry = await sendViaResend(fallbackEmail, sandboxNoteText);

      if (retry.error) {
        const retryMatch = retry.error.message?.match(/own email address \(([^)]+@[^)]+)\)/i);
        if (retryMatch?.[1] && retryMatch[1].trim() !== fallbackEmail) {
          fallbackEmail = retryMatch[1].trim();
          retry = await sendViaResend(fallbackEmail, sandboxNoteText);
        }
      }

      if (!retry.error) {
        return {
          delivered: true,
          saved: true,
          deliveredTo: fallbackEmail,
          sandboxForwarded: true,
          messageId: retry.data?.id,
          note: `Email delivered to verified Resend inbox (${fallbackEmail}). Verify a sending domain in Resend to deliver directly to ${payload.ownerEmail}.`,
        };
      }
    }

    console.warn('Listing inquiry Resend delivery failed:', error.message);
    return {
      delivered: false,
      saved: true,
      note: error.message || 'Email provider rejected outbound delivery.',
    };
  } catch (err) {
    console.warn('Listing inquiry Resend exception:', err);
    return {
      delivered: false,
      saved: true,
      note: err instanceof Error ? err.message : 'Unable to reach email delivery service.',
    };
  }
}
