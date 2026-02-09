
import React, { useState } from 'react';
import { useFunnel } from '../context/FunnelContext';
import { Renderer } from './preview/TemplateRenderers';
import { Smartphone, Monitor } from 'lucide-react';

export const LivePreview: React.FC = () => {
  const { config, activePageId } = useFunnel();
  const activePage = config.pages[activePageId];
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');

  if (!activePage) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Select a page to preview
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 relative">
      {/* Device Toggle Toolbar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-md p-1 flex gap-1 z-20">
          <button 
            onClick={() => setDevice('mobile')}
            className={`p-2 rounded-full transition-all ${device === 'mobile' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
              <Smartphone size={18} />
          </button>
          <button 
            onClick={() => setDevice('desktop')}
            className={`p-2 rounded-full transition-all ${device === 'desktop' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
              <Monitor size={18} />
          </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        {device === 'mobile' ? (
             /* Phone Frame */
            <div className="relative w-[375px] h-[750px] bg-black rounded-[3rem] shadow-2xl border-[8px] border-gray-900 overflow-hidden ring-4 ring-gray-200 transition-all duration-300">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-black rounded-b-xl z-50"></div>
                <div className="w-full h-full bg-[#EAEAEB] overflow-y-auto no-scrollbar">
                    <Renderer page={activePage} />
                </div>
            </div>
        ) : (
            /* Desktop Frame */
             <div className="relative w-full h-full max-w-[1200px] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300">
                <div className="w-full h-8 bg-gray-100 border-b border-gray-200 flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <div className="ml-4 flex-1 bg-white h-5 rounded border border-gray-200 text-[10px] text-center text-gray-400 leading-4">
                        https://{config.brand}.co/{activePage.path}
                    </div>
                </div>
                <div className="w-full h-[calc(100%-2rem)] bg-[#EAEAEB] overflow-y-auto">
                    <div className="max-w-[1000px] mx-auto min-h-full bg-white shadow-sm">
                        <Renderer page={activePage} />
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
