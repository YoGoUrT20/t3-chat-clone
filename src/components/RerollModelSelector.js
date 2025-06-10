import React from 'react';
import { models } from '../models';
import ModelSelection from './ModelSelection';

function RerollModelSelector({ currentModelName, onSelect }) {
  const currentModel = models.find(m => m.name === currentModelName);
  const otherModels = models.filter(m => m.name !== currentModelName);
  const items = currentModel ? [currentModel, ...otherModels] : models;

  return (
    <div className='flex flex-col gap-4'>
      <h2 className='text-lg font-semibold px-2 pt-2'>Select model to reroll</h2>
      <ModelSelection
        items={items}
        selectedModel={currentModel}
        onModelSelect={onSelect}
        className='w-full'
      />
    </div>
  );
}

export default RerollModelSelector; 