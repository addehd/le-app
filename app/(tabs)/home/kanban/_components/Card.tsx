import { View, Text, Platform } from 'react-native';
import { useState } from 'react';

export type AgentOperation = 'generate' | 'edit' | 'review';
export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed';

export type Card = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  model?: 'gemini-2.0-flash-exp' | 'claude-3-7-sonnet-20250219';
  order: number;
  createdAt: number;
  updatedAt: number;
  // Agent-specific fields
  cardType?: 'simple' | 'agent'; // Default 'simple' for backward compatibility
  agentPrompt?: string; // Prompt for agent operations
  agentOperation?: AgentOperation; // Type of agent operation
  agentStatus?: AgentStatus; // Status of agent execution
  agentResult?: string; // Result from agent execution
  targetFile?: string; // Target file path for file operations
};

interface CardComponentProps {
  card: Card;
  columnId: string;
  onDragStart: (cardId: string, columnId: string) => void;
  onCardClick: (cardId: string) => void;
  onDragEnter: (cardId: string, position: 'before' | 'after') => void;
  isDragging: boolean;
  dropPosition: 'before' | 'after' | null;
  onDelete?: (cardId: string) => void;
  onEdit?: (cardId: string) => void;
  onRunAgent?: (cardId: string, columnId: string) => void;
}

export const CardComponent = ({ 
  card, 
  columnId, 
  onDragStart, 
  onCardClick, 
  onDragEnter, 
  isDragging, 
  dropPosition,
  onDelete,
  onEdit,
  onRunAgent
}: CardComponentProps) => {
  const [isHovered, setIsHovered] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <div className="relative">
        {/* Drop indicator before */}
        {dropPosition === 'before' && (
          <div className="absolute -top-1.5 left-0 right-0 h-1 bg-primary-500 rounded-full z-10" />
        )}
        
        <div
          draggable={!isDragging}
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', JSON.stringify({ cardId: card.id, sourceColumnId: columnId }));
            onDragStart(card.id, columnId);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Determine if we're in the top or bottom half of the card
            const rect = e.currentTarget.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            const position = e.clientY < midpoint ? 'before' : 'after';
            
            onDragEnter(card.id, position);
          }}
          onDragLeave={(e) => {
            // Prevent triggering on child elements
            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          }}
          onDrop={(e) => {
            e.stopPropagation();
          }}
          onClick={() => onCardClick(card.id)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`bg-gray-700 rounded-xl p-4 mb-3 cursor-pointer select-none transition-all duration-200 shadow-sm ${
            isDragging ? 'opacity-30 scale-95' : ''
          } ${
            isHovered && !isDragging ? 'border-2 border-primary-500 shadow-lg transform -translate-y-0.5' : 'border-2 border-gray-600'
          }`}
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-white flex-1 flex items-center gap-2">
              {card.cardType === 'agent' && (
                <span className="text-xl" title="Agent Card">🤖</span>
              )}
              {card.title}
            </h3>
            <div className="flex gap-1">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(card.id);
                  }}
                  className="text-gray-400 hover:text-primary-400 transition-colors p-1 -mt-1"
                  title="Edit card"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(card.id);
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1 -mt-1 -mr-1"
                  title="Delete card"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-300 mb-3 leading-relaxed">
            {card.description}
          </p>
          
          {/* Agent Prompt Display */}
          {card.cardType === 'agent' && card.agentPrompt && (
            <div className="mb-3 p-2 bg-gray-800 border border-gray-600 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Agent Prompt:</p>
              <p className="text-xs text-gray-200">{card.agentPrompt}</p>
            </div>
          )}
          
          {/* Run Agent Button */}
          {card.cardType === 'agent' && onRunAgent && card.agentStatus !== 'running' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRunAgent(card.id, columnId);
              }}
              className={`w-full mb-3 px-4 py-2 rounded-lg font-medium transition-colors ${
                card.agentStatus === 'completed' 
                  ? 'bg-green-700 hover:bg-green-600 text-white' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {card.agentStatus === 'completed' ? '🔄 Run Again' : '▶️ Run Agent'}
            </button>
          )}
          
          {card.cardType === 'agent' && card.agentStatus === 'running' && (
            <div className="w-full mb-3 px-4 py-2 rounded-lg bg-yellow-600 text-white font-medium text-center">
              ⏳ Running...
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 items-center">
            {card.cardType === 'agent' && card.agentOperation && (
              <span className="bg-purple-600 px-3 py-1 rounded-full text-xs font-medium text-white">
                {card.agentOperation === 'generate' && '📝 Generate'}
                {card.agentOperation === 'edit' && '✏️ Edit'}
                {card.agentOperation === 'review' && '🔍 Review'}
              </span>
            )}
            {card.cardType === 'agent' && card.agentStatus && card.agentStatus !== 'idle' && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                card.agentStatus === 'running' ? 'bg-yellow-600 text-white' :
                card.agentStatus === 'completed' ? 'bg-green-600 text-white' :
                'bg-red-600 text-white'
              }`}>
                {card.agentStatus === 'running' && '⏳ Running'}
                {card.agentStatus === 'completed' && '✅ Completed'}
                {card.agentStatus === 'failed' && '❌ Failed'}
              </span>
            )}
            {card.model && (
              <span className="bg-gray-600 px-3 py-1 rounded-full text-xs font-medium text-gray-200">
                {card.model === 'gemini-2.0-flash-exp' ? '🤖 Gemini 2.0' : '🧠 Claude 3.7'}
              </span>
            )}
            {card.tags.map((tag, index) => (
              <span key={index} className="bg-primary-600 px-3 py-1 rounded-full text-xs font-medium text-white">
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        {/* Drop indicator after */}
        {dropPosition === 'after' && (
          <div className="absolute -bottom-1.5 left-0 right-0 h-1 bg-primary-500 rounded-full z-10" />
        )}
      </div>
    );
  }

  return (
    <View
      className={`bg-white rounded-xl p-4 mb-3 border-2 transition-all duration-200 shadow-sm ${
        isHovered ? 'border-primary-500 shadow-lg' : 'border-gray-200'
      }`}
    >
      <Text className="text-lg font-semibold text-gray-900 mb-2">
        {card.title}
      </Text>
      <Text className="text-sm text-gray-600 mb-3 leading-5">
        {card.description}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {card.tags.map((tag, index) => (
          <View key={index} className="bg-primary-100 px-3 py-1 rounded-full">
            <Text className="text-xs font-medium text-primary-700">{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

