import { View, Text, Platform, Pressable, TextInput, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useState, useEffect } from 'react';
import { ProjectStore, Project, PROJECT_COLORS } from '../../../../lib/store/projectStore';
import { KanbanStore } from '../../../../lib/store/kanbanStore';

interface ProjectWithStats extends Project {
  stats?: {
    totalCards: number;
    completedCards: number;
  };
}

export default function KanbanOverviewScreen() {
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectRootDir, setNewProjectRootDir] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithStats | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRootDir, setEditRootDir] = useState('');

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      const loadedProjects = await ProjectStore.getProjects();
      
      // Load stats for each project
      const projectsWithStats = await Promise.all(
        loadedProjects.map(async (project) => {
          const stats = await KanbanStore.getKanbanStats(project.id);
          return {
            ...project,
            stats: {
              totalCards: stats.totalCards,
              completedCards: stats.completedCards,
            },
          };
        })
      );
      
      setProjects(projectsWithStats);
      setIsLoaded(true);
    };
    loadProjects();
  }, []);

  const handleAddProject = async () => {
    if (!newProjectTitle.trim()) return;
    
    const newProject = await ProjectStore.createProject(
      newProjectTitle.trim(),
      newProjectDescription.trim() || undefined,
      newProjectRootDir.trim() || undefined
    );
    
    setProjects([...projects, newProject]);
    setNewProjectTitle('');
    setNewProjectDescription('');
    setNewProjectRootDir('');
    setShowAddProject(false);
  };

  const handleDeleteProject = async (id: string) => {
    await ProjectStore.deleteProject(id);
    setProjects(projects.filter(p => p.id !== id));
  };

  const handleEditProject = async () => {
    if (!editingProject || !editTitle.trim()) return;
    
    await ProjectStore.updateProject(editingProject.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      rootDir: editRootDir.trim() || undefined,
    });
    
    setProjects(projects.map(p => 
      p.id === editingProject.id 
        ? { ...p, title: editTitle.trim(), description: editDescription.trim() || undefined, rootDir: editRootDir.trim() || undefined }
        : p
    ));
    
    setEditingProject(null);
    setEditTitle('');
    setEditDescription('');
    setEditRootDir('');
  };

  const openEditModal = (project: ProjectWithStats) => {
    setEditingProject(project);
    setEditTitle(project.title);
    setEditDescription(project.description || '');
    setEditRootDir(project.rootDir || '');
  };

  if (Platform.OS === 'web') {
    return (
      <div className="flex flex-col h-screen bg-gray-900">
        {/* Header */}
        <header className="px-8 py-6 border-b border-gray-700">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">My Projects</h1>
              <p className="text-base text-gray-300">Select a project to view its kanban board</p>
            </div>
            <div className="flex gap-2">
              <Link href="/map" asChild>
                <button className="shrink-0 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors">
                  <span>🗺️ Map</span>
                </button>
              </Link>
              <button
                onClick={() => setShowAddProject(true)}
                className="shrink-0 inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <span>+ New Project</span>
              </button>
            </div>
          </div>
        </header>

        {/* Add Project Form */}
        {showAddProject && (
          <div className="px-8 py-4 border-b border-gray-700 bg-gray-800">
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                handleAddProject();
              }}
            >
              <input
                type="text"
                placeholder="Project name"
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                className="bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <textarea
                placeholder="Description (optional)"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                className="bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={2}
              />
              <input
                type="text"
                placeholder="Root directory (optional, e.g., /Users/you/myproject)"
                value={newProjectRootDir}
                onChange={(e) => setNewProjectRootDir(e.target.value)}
                className="bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex gap-2">
                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg">Add</button>
                <button type="button" onClick={() => {
                  setShowAddProject(false);
                  setNewProjectTitle('');
                  setNewProjectDescription('');
                  setNewProjectRootDir('');
                }} className="border border-gray-600 text-gray-300 font-medium px-4 py-2 rounded-lg hover:bg-gray-700">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Project Modal */}
        {editingProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setEditingProject(null)}>
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-white mb-4">Edit Project</h2>
              <form
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEditProject();
                }}
              >
                <input
                  type="text"
                  placeholder="Project name"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
                <textarea
                  placeholder="Description (optional)"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  rows={3}
                />
                <input
                  type="text"
                  placeholder="Root directory (optional, e.g., /Users/you/myproject)"
                  value={editRootDir}
                  onChange={(e) => setEditRootDir(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="flex gap-2 mt-2">
                  <button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg">Save</button>
                  <button type="button" onClick={() => setEditingProject(null)} className="flex-1 border border-gray-600 text-gray-300 font-medium px-4 py-2 rounded-lg hover:bg-gray-700">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        <div className="flex-1 overflow-auto p-8">
          {projects.length === 0 && isLoaded ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-xl text-gray-400 mb-4">No projects yet</p>
                <button
                  onClick={() => setShowAddProject(true)}
                  className="text-primary-500 hover:text-primary-400 font-medium"
                >
                  Create your first project
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const gradientColors = PROJECT_COLORS[project.color];
                return (
                  <Link key={project.id} href={`/(tabs)/home/kanban/${project.id}`} asChild>
                    <a 
                      className="block group bg-gray-800 rounded-2xl p-6 min-h-[200px] transition-all duration-200 hover:bg-gray-750"
                      style={{
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                        borderLeft: `4px solid ${gradientColors.from}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.3)';
                      }}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-start justify-between mb-3">
                          <span 
                            className="text-xs font-semibold px-3 py-1.5 rounded-full"
                            style={{ 
                              backgroundColor: gradientColors.from,
                              color: '#1f2937'
                            }}
                          >
                            Project
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openEditModal(project);
                              }}
                              className="text-gray-500 hover:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Edit project"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (confirm('Delete this project?')) {
                                  handleDeleteProject(project.id);
                                }
                              }}
                              className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-2xl leading-none"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">
                          {project.title}
                        </h3>
                        {project.description && (
                          <p className="text-sm text-gray-400 mb-4 flex-1">
                            {project.description}
                          </p>
                        )}
                        <div className="mt-auto pt-4 border-t border-gray-700 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <span className="font-medium">
                              {project.stats?.completedCards || 0}/{project.stats?.totalCards || 0}
                            </span>
                            <span className="text-gray-500">tasks</span>
                          </div>
                          {project.stats && project.stats.totalCards > 0 && (
                            <div className="flex-1 max-w-[100px] h-2 bg-gray-700 rounded-full overflow-hidden ml-3">
                              <div 
                                className="h-full rounded-full transition-all"
                                style={{ 
                                  width: `${(project.stats.completedCards / project.stats.totalCards) * 100}%`,
                                  backgroundColor: gradientColors.from
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </a>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-6 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-bold text-gray-900 mb-2">My Projects</Text>
            <Text className="text-base text-gray-600">Select a project to view its kanban board</Text>
          </View>
          <View className="flex-row gap-2">
            <Link href="/map" asChild>
              <Pressable className="bg-green-600 px-4 py-2 rounded-lg">
                <Text className="text-white font-medium">🗺️ Map</Text>
              </Pressable>
            </Link>
            <Pressable onPress={() => setShowAddProject(true)} className="bg-primary-600 px-4 py-2 rounded-lg">
              <Text className="text-white font-medium">+ New</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {showAddProject && (
        <View className="px-6 py-4 border-b border-gray-200 bg-gray-100">
          <TextInput
            placeholder="Project name"
            value={newProjectTitle}
            onChangeText={setNewProjectTitle}
            className="border border-gray-300 rounded-lg px-3 py-2 mb-2 bg-white"
            autoFocus
          />
          <TextInput
            placeholder="Description (optional)"
            value={newProjectDescription}
            onChangeText={setNewProjectDescription}
            className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-white"
            multiline
            numberOfLines={2}
          />
          <TextInput
            placeholder="Root directory (optional, e.g., /Users/you/myproject)"
            value={newProjectRootDir}
            onChangeText={setNewProjectRootDir}
            className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-white"
          />
          <View className="flex-row gap-2">
            <Pressable onPress={handleAddProject} className="flex-1 bg-primary-600 px-4 py-2 rounded-lg">
              <Text className="text-white text-center font-medium">Add</Text>
            </Pressable>
            <Pressable onPress={() => {
              setShowAddProject(false);
              setNewProjectTitle('');
              setNewProjectDescription('');
              setNewProjectRootDir('');
            }} className="flex-1 border border-gray-300 px-4 py-2 rounded-lg">
              <Text className="text-gray-700 text-center font-medium">Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Edit Project Modal */}
      <Modal
        visible={editingProject !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingProject(null)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md">
            <Text className="text-2xl font-bold text-gray-900 mb-4">Edit Project</Text>
            <TextInput
              placeholder="Project name"
              value={editTitle}
              onChangeText={setEditTitle}
              className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-white"
              autoFocus
            />
            <TextInput
              placeholder="Description (optional)"
              value={editDescription}
              onChangeText={setEditDescription}
              className="border border-gray-300 rounded-lg px-3 py-2 mb-4 bg-white"
              multiline
              numberOfLines={3}
            />
            <TextInput
              placeholder="Root directory (optional, e.g., /Users/you/myproject)"
              value={editRootDir}
              onChangeText={setEditRootDir}
              className="border border-gray-300 rounded-lg px-3 py-2 mb-4 bg-white"
            />
            <View className="flex-row gap-2">
              <Pressable onPress={handleEditProject} className="flex-1 bg-primary-600 px-4 py-3 rounded-lg">
                <Text className="text-white text-center font-medium">Save</Text>
              </Pressable>
              <Pressable onPress={() => setEditingProject(null)} className="flex-1 border border-gray-300 px-4 py-3 rounded-lg">
                <Text className="text-gray-700 text-center font-medium">Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView className="flex-1 px-6 py-6">
        {projects.length === 0 && isLoaded ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-xl text-gray-500 mb-4 text-center">No projects yet</Text>
            <Pressable onPress={() => setShowAddProject(true)}>
              <Text className="text-primary-600 font-medium">Create your first project</Text>
            </Pressable>
          </View>
        ) : (
          <View className="gap-4">
            {projects.map((project) => (
              <View key={project.id} className="relative">
                <Link href={`/(tabs)/home/kanban/${project.id}`} asChild>
                  <Pressable className="rounded-2xl p-6 min-h-[180px]" style={{
                    backgroundColor: PROJECT_COLORS[project.color].from,
                  }}>
                    <View className="flex-col h-full">
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="bg-white bg-opacity-60 px-2 py-1 rounded">
                          <Text className="text-xs font-semibold text-gray-700">Project</Text>
                        </View>
                        <Pressable
                          onPress={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openEditModal(project);
                          }}
                          className="bg-white/40 p-2 rounded-lg"
                        >
                          <Text className="text-gray-700 text-lg">✏️</Text>
                        </Pressable>
                      </View>
                      <Text className="text-2xl font-bold text-gray-900 mb-3">
                        {project.title}
                      </Text>
                      {project.description && (
                        <Text className="text-sm text-gray-700 mb-4">
                          {project.description}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                </Link>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
