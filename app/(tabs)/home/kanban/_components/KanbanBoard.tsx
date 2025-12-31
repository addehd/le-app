import { View, Text, ScrollView, Platform, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { ColumnComponent, type Column } from './Column';
import type { Card } from './Card';
import { ProjectStore } from '../../../../../lib/store/projectStore';
import { KanbanStore, DEFAULT_COLUMNS } from '../../../../../lib/store/kanbanStore';
import { VimShortcuts } from './VimShortcuts';

interface KanbanBoardProps {
  projectId?: string;
}

export const KanbanBoard = ({ projectId }: KanbanBoardProps) => {
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS);
  const [isDragging, setIsDragging] = useState(false);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [projectTitle, setProjectTitle] = useState<string>('My Kanban Board');
  
  // Add column form state
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  
  // Add card form state
  const [showAddCard, setShowAddCard] = useState<string | null>(null); // columnId or null
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [newCardTags, setNewCardTags] = useState('');
  const [newCardModel, setNewCardModel] = useState<'gemini-2.0-flash-exp' | 'claude-3-7-sonnet-20250219' | ''>('');
  const [newCardType, setNewCardType] = useState<'simple' | 'agent'>('simple');
  const [newCardAgentPrompt, setNewCardAgentPrompt] = useState('');
  const [newCardAgentOperation, setNewCardAgentOperation] = useState<'generate' | 'edit' | 'review'>('generate');
  const [newCardTargetFile, setNewCardTargetFile] = useState('');
  
  // Edit card state
  const [editingCard, setEditingCard] = useState<{ cardId: string; columnId: string } | null>(null);

  // Vim mode state
  const [selectedColumnIndex, setSelectedColumnIndex] = useState(0);
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [copiedCard, setCopiedCard] = useState<Card | null>(null);
  const lastKeyRef = useRef<string | null>(null);
  const lastKeyTimeRef = useRef<number>(0);

  // Load project title
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) {
        setProjectTitle('My Kanban Board');
        return;
      }

      try {
        const projects = await ProjectStore.getProjects();
        const project = projects.find(p => p.id === projectId);
        if (project) {
          setProjectTitle(project.title);
        }
      } catch (error) {
        console.error('Error loading project:', error);
      }
    };

    loadProject();
  }, [projectId]);

  // Load data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      if (!projectId) {
        setColumns(DEFAULT_COLUMNS);
        setIsLoaded(true);
        return;
      }

      try {
        // Migrate old data format if needed
        await KanbanStore.migrateOldData(projectId);
        
        // Load kanban data
        const loadedColumns = await KanbanStore.getKanbanData(projectId);
        setColumns(loadedColumns);
      } catch (error) {
        console.error('Error loading data from storage:', error);
        setColumns(DEFAULT_COLUMNS);
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
  }, [projectId]);

  // Save data to storage whenever columns change (after initial load)
  useEffect(() => {
    if (!isLoaded || !projectId) return;

    const saveData = async () => {
      try {
        await KanbanStore.saveKanbanData(projectId, columns);
      } catch (error) {
        console.error('Error saving data to storage:', error);
      }
    };

    saveData();
  }, [columns, isLoaded, projectId]);

  const handleDragStart = (cardId: string, columnId: string) => {
    setIsDragging(true);
    setDraggingCardId(cardId);
  };

  const handleDrop = (
    draggedCardId: string, 
    sourceColumnId: string, 
    targetColumnId: string, 
    targetCardId?: string,
    position?: 'before' | 'after'
  ) => {
    setIsDragging(false);
    setDraggingCardId(null);

    setColumns((prevColumns) => {
      const sourceColumn = prevColumns.find((col) => col.id === sourceColumnId);
      const targetColumn = prevColumns.find((col) => col.id === targetColumnId);
      
      if (!sourceColumn || !targetColumn) return prevColumns;

      const cardToMove = sourceColumn.cards.find((card) => card.id === draggedCardId);
      if (!cardToMove) return prevColumns;

      // Same column - reorder
      if (sourceColumnId === targetColumnId) {
        // If no target card specified, don't do anything (card didn't move)
        if (!targetCardId) return prevColumns;
        // If dropped on itself, don't do anything
        if (draggedCardId === targetCardId) return prevColumns;
        
        return prevColumns.map((col) => {
          if (col.id === sourceColumnId) {
            const cards = [...col.cards];
            
            // Find current positions
            const draggedIndex = cards.findIndex((card) => card.id === draggedCardId);
            const targetIndex = cards.findIndex((card) => card.id === targetCardId);
            
            if (draggedIndex === -1 || targetIndex === -1) return col;
            
            // Remove dragged card
            const [removed] = cards.splice(draggedIndex, 1);
            
            // Calculate new target index after removal
            const newTargetIndex = cards.findIndex((card) => card.id === targetCardId);
            
            // Insert at correct position
            const insertIndex = position === 'after' ? newTargetIndex + 1 : newTargetIndex;
            cards.splice(insertIndex, 0, removed);
            
            return { ...col, cards };
          }
          return col;
        });
      }

      // Different column - move card
      return prevColumns.map((col) => {
        if (col.id === sourceColumnId) {
          return { ...col, cards: col.cards.filter((card) => card.id !== draggedCardId) };
        } else if (col.id === targetColumnId) {
          // If dropped on a specific card, insert before or after it
          if (targetCardId) {
            const newCards = [...col.cards];
            const targetIndex = newCards.findIndex((card) => card.id === targetCardId);
            const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
            newCards.splice(insertIndex, 0, cardToMove);
            return { ...col, cards: newCards };
          }
          // Otherwise append to end
          return { ...col, cards: [...col.cards, cardToMove] };
        }
        return col;
      });
    });
  };

  const handleCardClick = (cardId: string) => {
    console.log('Card clicked:', cardId);
  };

  // Run agent for a card
  const handleRunAgent = async (cardId: string, columnId: string) => {
    console.log('Running agent for card:', cardId);
    
    // Find the card
    const column = columns.find(col => col.id === columnId);
    const card = column?.cards.find(c => c.id === cardId);
    
    if (!card || card.cardType !== 'agent' || !card.agentPrompt) {
      console.error('Invalid agent card or missing prompt');
      return;
    }
    
    // Update card status to running
    setColumns(prevColumns =>
      prevColumns.map(col =>
        col.id === columnId
          ? {
              ...col,
              cards: col.cards.map(c =>
                c.id === cardId
                  ? { ...c, agentStatus: 'running' as const }
                  : c
              )
            }
          : col
      )
    );
    
    // TODO: Call neu API and display results
    // For now, just simulate success after 2 seconds
    setTimeout(() => {
      setColumns(prevColumns =>
        prevColumns.map(col =>
          col.id === columnId
            ? {
                ...col,
                cards: col.cards.map(c =>
                  c.id === cardId
                    ? { ...c, agentStatus: 'completed' as const, agentResult: 'Generated code...' }
                    : c
                )
              }
            : col
        )
      );
    }, 2000);
  };

  // Get next order for card in column
  const getNextCardOrder = (columnId: string): number => {
    const column = columns.find(col => col.id === columnId);
    if (!column || column.cards.length === 0) return 0;
    const maxOrder = Math.max(...column.cards.map(card => card.order));
    return maxOrder + 1;
  };

  // Add new card to a column
  const handleAddCard = (columnId: string) => {
    if (!newCardTitle.trim()) return;

    const tags = newCardTags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    const order = getNextCardOrder(columnId);
    const baseCard = KanbanStore.createCard(
      newCardTitle.trim(),
      newCardDescription.trim(),
      tags,
      order,
      newCardModel || undefined
    );

    // Add agent-specific fields if it's an agent card
    const newCard: Card = newCardType === 'agent' ? {
      ...baseCard,
      cardType: 'agent',
      agentPrompt: newCardAgentPrompt.trim(),
      agentOperation: newCardAgentOperation,
      agentStatus: 'idle',
      targetFile: newCardTargetFile.trim() || undefined,
    } : baseCard;

    setColumns(prevColumns =>
      prevColumns.map(col =>
        col.id === columnId
          ? { ...col, cards: [...col.cards, newCard] }
          : col
      )
    );

    // Reset form
    setNewCardTitle('');
    setNewCardDescription('');
    setNewCardTags('');
    setNewCardModel('');
    setNewCardType('simple');
    setNewCardAgentPrompt('');
    setNewCardAgentOperation('generate');
    setNewCardTargetFile('');
    setShowAddCard(null);
  };

  // Cancel add card
  const handleCancelAddCard = () => {
    setNewCardTitle('');
    setNewCardDescription('');
    setNewCardTags('');
    setNewCardModel('');
    setNewCardType('simple');
    setNewCardAgentPrompt('');
    setNewCardAgentOperation('generate');
    setNewCardTargetFile('');
    setShowAddCard(null);
    setEditingCard(null);
  };

  // Start editing a card
  const handleStartEditCard = (cardId: string, columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    const card = column?.cards.find(c => c.id === cardId);
    if (!card) return;

    setEditingCard({ cardId, columnId });
    setNewCardTitle(card.title);
    setNewCardDescription(card.description);
    setNewCardTags(card.tags.join(', '));
    setNewCardModel(card.model || '');
    setShowAddCard(columnId);
  };

  // Save edited card
  const handleSaveEditCard = () => {
    if (!editingCard || !newCardTitle.trim()) return;

    const tags = newCardTags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    setColumns(prevColumns =>
      prevColumns.map(col =>
        col.id === editingCard.columnId
          ? {
              ...col,
              cards: col.cards.map(card =>
                card.id === editingCard.cardId
                  ? {
                      ...card,
                      title: newCardTitle.trim(),
                      description: newCardDescription.trim(),
                      tags,
                      model: newCardModel || undefined,
                      updatedAt: Date.now(),
                    }
                  : card
              ),
            }
          : col
      )
    );

    // Reset form
    setNewCardTitle('');
    setNewCardDescription('');
    setNewCardTags('');
    setNewCardModel('');
    setShowAddCard(null);
    setEditingCard(null);
  };

  // Column helpers
  const addColumn = (title: string) => {
    const nextOrder = columns.length > 0 ? Math.max(...columns.map(c => c.order)) + 1 : 0;
    const newColumn = KanbanStore.createColumn(title, nextOrder);
    setColumns((prev) => [...prev, newColumn]);
  };

  const confirmAddColumn = () => {
    const title = newColumnTitle.trim();
    if (!title) return;
    addColumn(title);
    setNewColumnTitle('');
    setShowAddColumn(false);
  };

  const cancelAddColumn = () => {
    setNewColumnTitle('');
    setShowAddColumn(false);
  };

  // Delete handlers
  const handleDeleteCard = (cardId: string) => {
    setColumns(prevColumns =>
      prevColumns.map(col => ({
        ...col,
        cards: col.cards.filter(card => card.id !== cardId)
      }))
    );
  };

  const handleDeleteColumn = (columnId: string) => {
    if (confirm('Delete this column and all its cards?')) {
      setColumns(prevColumns => prevColumns.filter(col => col.id !== columnId));
      // Adjust selected column index if needed
      if (selectedColumnIndex >= columns.length - 1) {
        setSelectedColumnIndex(Math.max(0, columns.length - 2));
      }
    }
  };

  // Vim keyboard handlers
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;
      const prevKey = timeSinceLastKey < 500 ? lastKeyRef.current : null;

      // Two-key combos
      if (prevKey === 'c' && e.key === 'c') {
        e.preventDefault();
        setShowAddColumn(true);
        lastKeyRef.current = null;
        return;
      }

      if (prevKey === 'd' && e.key === 'd') {
        e.preventDefault();
        // Delete selected card
        const column = columns[selectedColumnIndex];
        if (column && column.cards[selectedCardIndex]) {
          const cardToDelete = column.cards[selectedCardIndex];
          setColumns(prevColumns =>
            prevColumns.map(col =>
              col.id === column.id
                ? { ...col, cards: col.cards.filter(c => c.id !== cardToDelete.id) }
                : col
            )
          );
          if (selectedCardIndex >= column.cards.length - 1) {
            setSelectedCardIndex(Math.max(0, column.cards.length - 2));
          }
        }
        lastKeyRef.current = null;
        return;
      }

      if (prevKey === 'y' && e.key === 'y') {
        e.preventDefault();
        // Yank (copy) selected card
        const column = columns[selectedColumnIndex];
        if (column && column.cards[selectedCardIndex]) {
          setCopiedCard(column.cards[selectedCardIndex]);
        }
        lastKeyRef.current = null;
        return;
      }

      if (prevKey === 'g' && e.key === 'g') {
        e.preventDefault();
        setSelectedCardIndex(0);
        lastKeyRef.current = null;
        return;
      }

      // Single-key commands
      switch (e.key) {
        case 'h':
          e.preventDefault();
          setSelectedColumnIndex(Math.max(0, selectedColumnIndex - 1));
          setSelectedCardIndex(0);
          break;
        case 'l':
          e.preventDefault();
          setSelectedColumnIndex(Math.min(columns.length - 1, selectedColumnIndex + 1));
          setSelectedCardIndex(0);
          break;
        case 'j': {
          e.preventDefault();
          const col = columns[selectedColumnIndex];
          if (col) setSelectedCardIndex(Math.min(col.cards.length - 1, selectedCardIndex + 1));
          break;
        }
        case 'k': {
          e.preventDefault();
          setSelectedCardIndex(Math.max(0, selectedCardIndex - 1));
          break;
        }
        case 'G': {
          e.preventDefault();
          const col = columns[selectedColumnIndex];
          if (col) setSelectedCardIndex(Math.max(0, col.cards.length - 1));
          break;
        }
        case 'o':
          e.preventDefault();
          if (columns[selectedColumnIndex]) {
            setShowAddCard(columns[selectedColumnIndex].id);
          }
          break;
        case 'p':
          e.preventDefault();
          // Paste card below
          if (copiedCard && columns[selectedColumnIndex]) {
            const col = columns[selectedColumnIndex];
            const newCard = { ...copiedCard, id: Math.random().toString(36).substr(2, 9) };
            setColumns(prevColumns =>
              prevColumns.map(c =>
                c.id === col.id
                  ? { ...c, cards: [...c.cards, newCard] }
                  : c
              )
            );
          }
          break;
        case 'c':
        case 'd':
        case 'y':
        case 'g':
          lastKeyRef.current = e.key;
          lastKeyTimeRef.current = now;
          break;
        default:
          lastKeyRef.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [columns, selectedColumnIndex, selectedCardIndex, copiedCard]);

  if (Platform.OS === 'web') {
    return (
      <div className="flex flex-col h-screen bg-gray-900">
        {/* Header */}
        <header className="px-8 py-6 border-b border-gray-700">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">{projectTitle}</h1>
              <p className="text-base text-gray-300">Drag and drop cards to organize your workflow</p>
            </div>
            <div className="flex items-center gap-3">
              <VimShortcuts />
              <button
                onClick={() => setShowAddColumn(true)}
                className="shrink-0 inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <span>+ Add column</span>
              </button>
            </div>
          </div>
        </header>

        {/* Add Column Form (web) */}
        {showAddColumn && (
          <div className="px-8 py-4 border-b border-gray-700 bg-gray-800">
            <form
              className="flex items-center gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                confirmAddColumn();
              }}
            >
              <input
                type="text"
                placeholder="Column title"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg">Add</button>
              <button type="button" onClick={cancelAddColumn} className="border border-gray-600 text-gray-300 font-medium px-4 py-2 rounded-lg hover:bg-gray-700">Cancel</button>
            </form>
          </div>
        )}

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-6 p-8 h-full">
            {columns.map((column) => (
              <ColumnComponent
                key={column.id}
                column={column}
                onDrop={handleDrop}
                onDragStart={handleDragStart}
                onCardClick={handleCardClick}
                isDragging={isDragging}
                draggingCardId={draggingCardId}
                onAddCard={() => setShowAddCard(column.id)}
                showAddCardForm={showAddCard === column.id}
                onDeleteColumn={handleDeleteColumn}
                onDeleteCard={handleDeleteCard}
                onEditCard={handleStartEditCard}
                onRunAgent={handleRunAgent}
                addCardForm={
                  showAddCard === column.id ? (
                    <div className="bg-gray-800 rounded-xl p-4 mb-3 border-2 border-primary-500 shadow-lg">
                      {/* Card Type Selector */}
                      <div className="mb-3">
                        <label className="text-sm text-gray-300 mb-2 block">Card Type</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setNewCardType('simple')}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                              newCardType === 'simple'
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            📋 Simple
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewCardType('agent')}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                              newCardType === 'agent'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            🤖 Agent
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Card title"
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        className="w-full bg-gray-700 text-white placeholder-gray-400 px-3 py-2 mb-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        autoFocus
                      />
                      <textarea
                        placeholder="Description"
                        value={newCardDescription}
                        onChange={(e) => setNewCardDescription(e.target.value)}
                        className="w-full bg-gray-700 text-white placeholder-gray-400 px-3 py-2 mb-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        rows={3}
                      />
                      <input
                        type="text"
                        placeholder="Tags (comma-separated)"
                        value={newCardTags}
                        onChange={(e) => setNewCardTags(e.target.value)}
                        className="w-full bg-gray-700 text-white placeholder-gray-400 px-3 py-2 mb-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />

                      {/* Agent-specific fields */}
                      {newCardType === 'agent' && (
                        <>
                          <textarea
                            placeholder="Agent prompt (what should the agent do?)"
                            value={newCardAgentPrompt}
                            onChange={(e) => setNewCardAgentPrompt(e.target.value)}
                            className="w-full bg-gray-700 text-white placeholder-gray-400 px-3 py-2 mb-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                            rows={2}
                          />
                          <select
                            value={newCardAgentOperation}
                            onChange={(e) => setNewCardAgentOperation(e.target.value as any)}
                            className="w-full bg-gray-700 text-white px-3 py-2 mb-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="generate">📝 Generate Code</option>
                            <option value="edit">✏️ Edit Code</option>
                            <option value="review">🔍 Review Code</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Target file (e.g., src/main.py)"
                            value={newCardTargetFile}
                            onChange={(e) => setNewCardTargetFile(e.target.value)}
                            className="w-full bg-gray-700 text-white placeholder-gray-400 px-3 py-2 mb-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </>
                      )}

                      {/* Model selector (for both types) */}
                      <select
                        value={newCardModel}
                        onChange={(e) => setNewCardModel(e.target.value as any)}
                        className="w-full bg-gray-700 text-white px-3 py-2 mb-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select AI Model (optional)</option>
                        <option value="gemini-2.0-flash-exp">🤖 Gemini 2.0 Flash</option>
                        <option value="claude-3-7-sonnet-20250219">🧠 Claude 3.7 Sonnet</option>
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editingCard ? handleSaveEditCard() : handleAddCard(column.id)}
                          className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                        >
                          {editingCard ? 'Save Changes' : 'Add Card'}
                        </button>
                        <button
                          onClick={handleCancelAddCard}
                          className="flex-1 bg-gray-700 text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null
                }
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 py-6 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-bold text-gray-900 mb-2">{projectTitle}</Text>
            <Text className="text-base text-gray-600">Track your tasks and stay organized</Text>
          </View>
          <TouchableOpacity onPress={() => setShowAddColumn(true)} className="bg-primary-600 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">+ Add column</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Column Form (native) */}
      {showAddColumn && (
        <View className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <View className="flex-row items-center gap-3">
            <TextInput
              placeholder="Column title"
              value={newColumnTitle}
              onChangeText={setNewColumnTitle}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              autoFocus
            />
            <TouchableOpacity onPress={confirmAddColumn} className="bg-primary-600 px-4 py-2 rounded-lg">
              <Text className="text-white font-medium">Add</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={cancelAddColumn} className="border border-gray-300 px-4 py-2 rounded-lg">
              <Text className="text-gray-700 font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-1 px-6 py-6"
        contentContainerStyle={{ gap: 16 }}
      >
        {columns.map((column) => (
          <ColumnComponent
            key={column.id}
            column={column}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onCardClick={handleCardClick}
            isDragging={isDragging}
            draggingCardId={draggingCardId}
            onAddCard={() => setShowAddCard(column.id)}
            showAddCardForm={showAddCard === column.id}
            onEditCard={handleStartEditCard}
            addCardForm={
              showAddCard === column.id ? (
                <View className="bg-white rounded-xl p-4 mb-3 border-2 border-primary-500 shadow-lg">
                  <TextInput
                    placeholder="Card title"
                    value={newCardTitle}
                    onChangeText={setNewCardTitle}
                    className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg"
                    autoFocus
                  />
                  <TextInput
                    placeholder="Description"
                    value={newCardDescription}
                    onChangeText={setNewCardDescription}
                    className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg"
                    multiline
                    numberOfLines={3}
                  />
                  <TextInput
                    placeholder="Tags (comma-separated)"
                    value={newCardTags}
                    onChangeText={setNewCardTags}
                    className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg"
                  />
                  <View className="mb-3">
                    <Text className="text-sm text-gray-600 mb-2">AI Model (optional):</Text>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => setNewCardModel(newCardModel === 'gemini-2.0-flash-exp' ? '' : 'gemini-2.0-flash-exp')}
                        className={`flex-1 px-3 py-2 rounded-lg border ${newCardModel === 'gemini-2.0-flash-exp' ? 'bg-primary-100 border-primary-500' : 'bg-white border-gray-300'}`}
                      >
                        <Text className={`text-center text-sm ${newCardModel === 'gemini-2.0-flash-exp' ? 'text-primary-700 font-medium' : 'text-gray-700'}`}>🤖 Gemini</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setNewCardModel(newCardModel === 'claude-3-7-sonnet-20250219' ? '' : 'claude-3-7-sonnet-20250219')}
                        className={`flex-1 px-3 py-2 rounded-lg border ${newCardModel === 'claude-3-7-sonnet-20250219' ? 'bg-primary-100 border-primary-500' : 'bg-white border-gray-300'}`}
                      >
                        <Text className={`text-center text-sm ${newCardModel === 'claude-3-7-sonnet-20250219' ? 'text-primary-700 font-medium' : 'text-gray-700'}`}>🧠 Claude</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => editingCard ? handleSaveEditCard() : handleAddCard(column.id)}
                      className="flex-1 bg-primary-600 px-4 py-2 rounded-lg"
                    >
                      <Text className="text-white text-center font-medium">{editingCard ? 'Save' : 'Add Card'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleCancelAddCard}
                      className="flex-1 bg-gray-200 px-4 py-2 rounded-lg"
                    >
                      <Text className="text-gray-700 text-center font-medium">Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null
            }
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

