import { Platform, View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function BiddingScreen() {
  const router = useRouter();
  const [askingPrice, setAskingPrice] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [competition, setCompetition] = useState<'low' | 'medium' | 'high'>('medium');
  
  const calculateBiddingStrategy = () => {
    const asking = parseFloat(askingPrice.replace(/\s/g, ''));
    const estimated = parseFloat(estimatedValue.replace(/\s/g, ''));
    
    if (!asking || !estimated) return null;
    
    let multiplier = 1.0;
    if (competition === 'low') multiplier = 1.02;
    if (competition === 'medium') multiplier = 1.05;
    if (competition === 'high') multiplier = 1.08;
    
    const suggestedMax = estimated * multiplier;
    const openingBid = asking * 0.98;
    const incrementSuggestion = competition === 'high' ? 25000 : competition === 'medium' ? 15000 : 10000;
    
    return {
      openingBid: Math.round(openingBid),
      suggestedMax: Math.round(suggestedMax),
      incrementSuggestion,
      difference: Math.round(suggestedMax - asking)
    };
  };
  
  const strategy = calculateBiddingStrategy();

  if (Platform.OS === 'web') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => router.back()}
            className="mb-6 text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          
          <div className="bg-gray-800 rounded-2xl shadow-xl p-8 space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">Budgivningsstrategi</h1>
              <p className="text-gray-300">Plan your bidding strategy for Swedish home purchases</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Utgångspris (SEK)</label>
                <input
                  type="text"
                  value={askingPrice}
                  onChange={(e) => setAskingPrice(e.target.value)}
                  placeholder="e.g. 3500000"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Uppskattat värde (SEK)</label>
                <input
                  type="text"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  placeholder="e.g. 3800000"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300 mb-3">Konkurrensnivå</label>
              <div className="flex gap-3">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setCompetition(level)}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                      competition === level
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {level === 'low' ? 'Låg' : level === 'medium' ? 'Medel' : 'Hög'}
                  </button>
                ))}
              </div>
            </div>

            {strategy && (
              <div className="border-t border-gray-700 pt-6 space-y-4">
                <h2 className="text-2xl font-bold text-primary-400">Din strategi</h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Öppningsbud</p>
                    <p className="text-2xl font-bold">{strategy.openingBid.toLocaleString('sv-SE')} kr</p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Max bud (förslag)</p>
                    <p className="text-2xl font-bold text-primary-400">{strategy.suggestedMax.toLocaleString('sv-SE')} kr</p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Föreslagen höjning</p>
                    <p className="text-2xl font-bold">{strategy.incrementSuggestion.toLocaleString('sv-SE')} kr</p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Över utgångspris</p>
                    <p className={`text-2xl font-bold ${strategy.difference > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {strategy.difference > 0 ? '+' : ''}{strategy.difference.toLocaleString('sv-SE')} kr
                    </p>
                  </div>
                </div>

                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-blue-300">💡 Tips för budgivning</h3>
                  <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                    <li>Sätt en absolut maxgräns innan budgivningen börjar</li>
                    <li>Använd jämna tal (50 000, 100 000) för att signalera bestämdhet</li>
                    <li>Vid hög konkurrens, överväg större höjningar tidigt</li>
                    <li>Kontrollera liknande försäljningar i området (jämförpriser)</li>
                    <li>Tänk på lånelöfte och kommande renoverings kostnader</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 py-4">
        <Pressable 
          onPress={() => router.back()}
          className="mb-4"
        >
          <Text className="text-gray-600">← Back</Text>
        </Pressable>

        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900">Budgivningsstrategi</Text>
          <Text className="text-gray-600 mt-1">Plan your bidding strategy</Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">Utgångspris (SEK)</Text>
            <TextInput
              value={askingPrice}
              onChangeText={setAskingPrice}
              placeholder="e.g. 3500000"
              keyboardType="numeric"
              className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">Uppskattat värde (SEK)</Text>
            <TextInput
              value={estimatedValue}
              onChangeText={setEstimatedValue}
              placeholder="e.g. 3800000"
              keyboardType="numeric"
              className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-3">Konkurrensnivå</Text>
            <View className="flex-row gap-2">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <Pressable
                  key={level}
                  onPress={() => setCompetition(level)}
                  className={`flex-1 py-3 px-4 rounded-lg ${
                    competition === level ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <Text className={`text-center font-medium ${
                    competition === level ? 'text-white' : 'text-gray-700'
                  }`}>
                    {level === 'low' ? 'Låg' : level === 'medium' ? 'Medel' : 'Hög'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {strategy && (
            <View className="mt-6 pt-6 border-t border-gray-200">
              <Text className="text-2xl font-bold text-primary-600 mb-4">Din strategi</Text>
              
              <View className="space-y-3">
                <View className="bg-gray-100 rounded-lg p-4">
                  <Text className="text-sm text-gray-600 mb-1">Öppningsbud</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {strategy.openingBid.toLocaleString('sv-SE')} kr
                  </Text>
                </View>
                
                <View className="bg-gray-100 rounded-lg p-4">
                  <Text className="text-sm text-gray-600 mb-1">Max bud (förslag)</Text>
                  <Text className="text-xl font-bold text-primary-600">
                    {strategy.suggestedMax.toLocaleString('sv-SE')} kr
                  </Text>
                </View>
                
                <View className="bg-gray-100 rounded-lg p-4">
                  <Text className="text-sm text-gray-600 mb-1">Föreslagen höjning</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {strategy.incrementSuggestion.toLocaleString('sv-SE')} kr
                  </Text>
                </View>
                
                <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <Text className="font-semibold text-blue-900 mb-2">💡 Tips för budgivning</Text>
                  <Text className="text-sm text-gray-700 leading-6">
                    • Sätt en absolut maxgräns innan{'\n'}
                    • Använd jämna tal för bestämdhet{'\n'}
                    • Vid hög konkurrens, höj större belopp{'\n'}
                    • Kontrollera jämförpriser i området{'\n'}
                    • Tänk på lånelöfte och renoveringskostnader
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
