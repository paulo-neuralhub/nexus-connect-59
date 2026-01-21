import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GeniusChatEnhanced } from '@/components/features/genius';
import { usePageTitle } from '@/contexts/page-context';

export default function GeniusPage() {
  const { setTitle } = usePageTitle();
  const navigate = useNavigate();
  
  useEffect(() => {
    setTitle('IP-GENIUS');
  }, [setTitle]);
  
  const handleNavigateToTranslator = () => {
    navigate('/app/genius/translator');
  };
  
  return (
    <div className="h-[calc(100vh-8rem)]">
      <GeniusChatEnhanced />
    </div>
  );
}
