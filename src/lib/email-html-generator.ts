import type { EmailEditorContent, EmailBlock } from '@/types/marketing';

export function generateEmailHtml(content: EmailEditorContent): string {
  const { blocks, settings } = content;
  
  const bodyContent = blocks.map(block => renderBlockToHtml(block)).join('');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
  <style>
    body { margin: 0; padding: 0; font-family: ${settings.fontFamily}; }
    a { color: ${settings.linkColor}; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body style="background-color: ${settings.backgroundColor}; margin: 0; padding: 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" width="${settings.contentWidth}" cellspacing="0" cellpadding="0" style="background-color: #ffffff;">
          ${bodyContent}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function renderBlockToHtml(block: EmailBlock): string {
  const padding = block.styles?.padding || '16px';
  const bgColor = block.styles?.backgroundColor || 'transparent';
  
  let content = '';
  
  switch (block.type) {
    case 'text':
      content = block.content.html as string;
      break;
      
    case 'button':
      const btn = block.content;
      content = `
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
          <tr>
            <td style="background-color: ${btn.backgroundColor}; border-radius: ${btn.borderRadius}px; padding: 12px 24px;">
              <a href="${btn.link}" style="color: ${btn.textColor}; text-decoration: none; font-weight: bold;">
                ${btn.text}
              </a>
            </td>
          </tr>
        </table>
      `;
      break;
      
    case 'image':
      const img = block.content;
      const imgTag = `<img src="${img.src}" alt="${img.alt}" style="max-width: 100%; width: ${img.width};">`;
      content = img.link 
        ? `<a href="${img.link}">${imgTag}</a>`
        : imgTag;
      break;
      
    case 'header':
      const header = block.content;
      const logoHtml = header.logoUrl 
        ? `<img src="${header.logoUrl}" alt="Logo" style="max-height: 60px; margin-bottom: 16px;">`
        : '';
      content = `
        <div style="text-align: ${header.alignment};">
          ${logoHtml}
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">${header.title}</h1>
        </div>
      `;
      break;
      
    case 'divider':
      content = `<hr style="border: none; border-top: ${block.content.width}px ${block.content.style} ${block.content.color}; margin: 0;">`;
      break;
      
    case 'spacer':
      content = `<div style="height: ${block.content.height}px;"></div>`;
      break;
      
    case 'footer':
      const footer = block.content;
      content = `
        <div style="text-align: center; font-size: 12px; color: #6B7280;">
          <p style="margin: 8px 0;">${footer.companyName}</p>
          <p style="margin: 8px 0;">${footer.address}</p>
          <p style="margin: 8px 0;">${footer.unsubscribeText}</p>
        </div>
      `;
      break;
      
    case 'html':
      content = block.content.code as string;
      break;
      
    default:
      content = '';
  }
  
  return `
    <tr>
      <td style="padding: ${padding}; background-color: ${bgColor};">
        ${content}
      </td>
    </tr>
  `;
}
