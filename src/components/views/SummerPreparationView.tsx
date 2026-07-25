import React from 'react';
import { Sun } from 'lucide-react';
import { SummerPrepUnit } from '../../types';
import { PreparationView } from './PreparationView';

interface SummerPreparationViewProps {
  data: SummerPrepUnit[];
  onAddOrUpdate: (item: SummerPrepUnit) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isEditing?: boolean;
  setToast?: (toast: { message: string; id: number }) => void;
  opponents?: { id: string, name: string }[];
}

export const SummerPreparationView: React.FC<SummerPreparationViewProps> = ({
  data,
  onAddOrUpdate,
  onDelete,
  isEditing = false,
  setToast,
  opponents = []
}) => {
  return (
    <PreparationView
      title="Sommer-Vorbereitung"
      subtitle="Vorbereitungsplan 06.07.2026 - 16.08.2026"
      icon={<Sun size={14} className="text-yellow-400" />}
      startDate="2026-07-06"
      endDate="2026-08-16"
      data={data}
      onAddOrUpdate={onAddOrUpdate}
      onDelete={onDelete}
      isEditing={isEditing}
      setToast={setToast}
      opponents={opponents}
      config={{
        showAthletik: false,
        showVormittag: false,
        showIndividual: false,
        showVideo: false,
        showTraining: false,
        showOpponent: true,
        showStartEnd: true
      }}
    />
  );
};
