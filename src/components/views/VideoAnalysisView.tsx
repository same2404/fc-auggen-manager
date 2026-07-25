import React from 'react';
import { motion } from 'motion/react';
import { Video, ExternalLink } from 'lucide-react';

export const VideoAnalysisView: React.FC = () => {
  const videoUrl = "https://aistudio.google.com/apps/187121d9-1251-4d72-b56a-91f6f4aa8f4b?showPreview=true&showAssistant=true&fullscreenApplet=true";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#E2001A]/10 rounded-lg">
            <Video className="w-6 h-6 text-[#E2001A]" />
          </div>
          <div>
            <h2 className="text-2xl font-serif italic text-gray-900">Video-Analyse</h2>
            <p className="text-sm text-gray-500">Externe Video-Analyse Tools und Ressourcen</p>
          </div>
        </div>
        <a 
          href={videoUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-[#E2001A] text-white rounded-lg hover:bg-[#E2001A]/90 transition-colors text-sm font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          In neuem Tab öffnen
        </a>
      </div>

      <div className="brutalist-card overflow-hidden rounded-xl h-[800px] relative">
        <iframe 
          src={videoUrl}
          className="w-full h-full border-0"
          title="Video Analysis Tool"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-2">Hinweis</h3>
        <p className="text-sm text-gray-600">
          Dieses Tool ermöglicht die detaillierte Analyse von Spielszenen und Trainingsvideos. 
          Die Daten werden extern verwaltet und hier zur schnellen Einsicht eingebettet.
        </p>
      </div>
    </motion.div>
  );
};
