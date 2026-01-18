import type { EmailBlock } from '@/types/marketing';
import { Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

interface Props {
  block: EmailBlock;
}

const socialIcons: Record<string, React.ElementType> = {
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
};

export function BlockRenderer({ block }: Props) {
  const style: React.CSSProperties = {
    padding: block.styles?.padding || '16px',
    backgroundColor: block.styles?.backgroundColor || 'transparent',
  };
  
  return (
    <div style={style}>
      {renderBlockContent(block)}
    </div>
  );
}

function renderBlockContent(block: EmailBlock) {
  switch (block.type) {
    case 'header':
      return (
        <div style={{ textAlign: (block.content.alignment as 'left' | 'center' | 'right') || 'center' }}>
          {block.content.logoUrl && (
            <img 
              src={block.content.logoUrl as string} 
              alt="Logo" 
              style={{ maxHeight: 60, marginBottom: 16, display: 'inline-block' }}
            />
          )}
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>
            {block.content.title as string}
          </h1>
        </div>
      );
      
    case 'text':
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: block.content.html as string }}
          style={{ lineHeight: 1.6 }}
        />
      );
      
    case 'image':
      return (
        <div style={{ textAlign: (block.content.alignment as 'left' | 'center' | 'right') || 'center' }}>
          {block.content.src ? (
            <img 
              src={block.content.src as string}
              alt={block.content.alt as string}
              style={{ 
                maxWidth: '100%',
                width: block.content.width as string,
                borderRadius: 4,
                display: 'inline-block'
              }}
            />
          ) : (
            <div className="bg-muted h-32 flex items-center justify-center text-muted-foreground rounded">
              Click para añadir imagen
            </div>
          )}
        </div>
      );
      
    case 'button':
      return (
        <div style={{ textAlign: (block.content.alignment as 'left' | 'center' | 'right') || 'center' }}>
          <a
            href={block.content.link as string || '#'}
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: block.content.backgroundColor as string,
              color: block.content.textColor as string,
              textDecoration: 'none',
              borderRadius: block.content.borderRadius as number,
              fontWeight: 'bold',
            }}
          >
            {block.content.text as string}
          </a>
        </div>
      );
      
    case 'divider':
      return (
        <hr 
          style={{ 
            border: 'none',
            borderTop: `${block.content.width}px ${block.content.style} ${block.content.color}`,
            margin: '16px 0'
          }} 
        />
      );
      
    case 'spacer':
      return <div style={{ height: block.content.height as number }} />;
      
    case 'social':
      const networks = block.content.networks as string[];
      return (
        <div style={{ textAlign: (block.content.alignment as 'left' | 'center' | 'right') || 'center' }}>
          {networks.map(network => {
            const Icon = socialIcons[network];
            if (!Icon) return null;
            return (
              <a 
                key={network}
                href="#"
                style={{ display: 'inline-block', margin: '0 8px' }}
              >
                <Icon className="w-6 h-6 text-muted-foreground hover:text-foreground transition-colors" />
              </a>
            );
          })}
        </div>
      );
      
    case 'footer':
      return (
        <div style={{ textAlign: 'center', fontSize: 12, color: '#6B7280' }}>
          <p style={{ margin: '8px 0' }}>{block.content.companyName as string}</p>
          <p style={{ margin: '8px 0' }}>{block.content.address as string}</p>
          <p style={{ margin: '8px 0' }}>{block.content.unsubscribeText as string}</p>
        </div>
      );
      
    case 'html':
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: block.content.code as string }}
        />
      );
      
    default:
      return <div className="text-muted-foreground">Bloque desconocido</div>;
  }
}
