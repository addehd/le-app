import { View, Text, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { CardComponent, type Card } from './Card';

export type Column = {
  id: string;
  title: string;
  order: number;
  cards: Card[];
};

interface ColumnComponentProps {
  column: Column;
  onDrop: (cardId: string, sourceColumnId: string, targetColumnId: string, targetCardId?: string, position?: 'before' | 'after') => void;
  onDragStart: (cardId: string, columnId: string) => void;
  onCardClick: (cardId: string) => void;
  isDragging: boolean;
  draggingCardId: string | null;
  onAddCard?: (columnId: string) => void;
  showAddCardForm?: boolean;
  addCardForm?: React.ReactNode;
  onDeleteColumn?: (columnId: string) => void;
  onDeleteCard?: (cardId: string) => void;
  onEditCard?: (cardId: string, columnId: string) => void;
  onRunAgent?: (cardId: string, columnId: string) => void;
}

export const ColumnComponent = ({ 
  column, 
  onDrop, 
  onDragStart, 
  onCardClick, 
  isDragging, 
  draggingCardId,
  onAddCard,
  showAddCardForm = false,
  addCardForm,
  onDeleteColumn,
  onDeleteCard,
  onEditCard,
  onRunAgent
}: ColumnComponentProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ cardId: string; position: 'before' | 'after' } | null>(null);

  if (Platform.OS === 'web') {
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          // Only set to false if leaving the column container itself
          const related = e.relatedTarget as Node;
          if (!e.currentTarget.contains(related)) {
            setIsDragOver(false);
            setDropTarget(null);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          
          if (dropTarget) {
            onDrop(data.cardId, data.sourceColumnId, column.id, dropTarget.cardId, dropTarget.position);
          } else {
            // Drop at end of column if no specific target
            onDrop(data.cardId, data.sourceColumnId, column.id);
          }
          
          setDropTarget(null);
        }}
        className={`bg-gray-800 rounded-2xl p-5 transition-all duration-200 ${
          isDragOver ? 'bg-primary-900 ring-2 ring-primary-500 ring-offset-2 ring-offset-gray-900' : ''
        } ${isDragging ? 'ring-1 ring-gray-700' : ''}`}
        style={{ width: '360px', minHeight: '500px' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white flex-1">{column.title}</h2>
          <div className="flex items-center gap-2">
            <span className="bg-primary-600 px-3 py-1.5 rounded-full text-sm font-semibold text-white">
              {column.cards.length}
            </span>
            {onDeleteColumn && (
              <button
                onClick={() => onDeleteColumn(column.id)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                title="Delete column"
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                  <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="space-y-0 relative">
          {column.cards.map((card) => (
            <CardComponent
              key={card.id}
              card={card}
              columnId={column.id}
              onDragStart={onDragStart}
              onCardClick={onCardClick}
              onDragEnter={(cardId, position) => setDropTarget({ cardId, position })}
              isDragging={draggingCardId === card.id}
              dropPosition={dropTarget?.cardId === card.id ? dropTarget.position : null}
              onDelete={onDeleteCard}
              onEdit={onEditCard ? (cardId) => onEditCard(cardId, column.id) : undefined}
              onRunAgent={onRunAgent}
            />
          ))}
          {column.cards.length === 0 && !showAddCardForm && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">Drop cards here</p>
            </div>
          )}
          
          {/* Add Card Form */}
          {addCardForm}
          
          {/* Add Card Button */}
          {!showAddCardForm && onAddCard && (
            <button
              onClick={() => onAddCard(column.id)}
              className="w-full mt-3 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span>
              <span>Add Card</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <View className="bg-gray-50 rounded-2xl p-4 min-w-[320px] max-w-[400px] flex-1">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-xl font-bold text-gray-900">{column.title}</Text>
        <View className="bg-primary-100 px-3 py-1 rounded-full">
          <Text className="text-sm font-semibold text-primary-700">
            {column.cards.length}
          </Text>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {column.cards.map((card) => (
          <CardComponent
            key={card.id}
            card={card}
            columnId={column.id}
            onDragStart={onDragStart}
            onCardClick={onCardClick}
            onDragEnter={() => {}}
            isDragging={draggingCardId === card.id}
            dropPosition={null}
          />
        ))}
        
        {/* Add Card Form */}
        {addCardForm}
        
        {/* Add Card Button */}
        {!showAddCardForm && onAddCard && (
          <TouchableOpacity
            onPress={() => onAddCard(column.id)}
            className="w-full mt-3 px-4 py-3 bg-gray-100 rounded-xl flex-row items-center justify-center gap-2"
          >
            <Text className="text-xl text-gray-600">+</Text>
            <Text className="text-gray-600 font-medium">Add Card</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

