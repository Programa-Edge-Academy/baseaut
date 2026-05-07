import { View, Text } from 'react-native';

export type PerformanceLevel = 'Desenvolver' | 'Adequado' | 'Satisfatório';
export type HelpLevel = 
  | 'Verbal 1' | 'Verbal 2' | 'Verbal 3' 
  | 'Exemplo 1' | 'Exemplo 2' | 'Exemplo 3' 
  | 'Físico 1' | 'Físico 2' | 'Físico 3';

export interface Exercise {
  id: string;
  name: string;
  performanceLevel?: PerformanceLevel;
  helpLevels?: HelpLevel[];
  crises?: number[];
}

export interface Session {
  id: string;
  date: string;
  exercises: Exercise[];
}

interface ChartDetailProps {
  session: Session;
  mode: 'performance' | 'help';
}

export function ChartDetail({ session, mode }: ChartDetailProps) {
  const visibleExercises = session.exercises.filter((ex) =>
    mode === 'performance' ? !!ex.performanceLevel : !!ex.helpLevels && ex.helpLevels.length > 0
  );

  if (visibleExercises.length === 0) return null;

  const getPerformanceColor = (level: PerformanceLevel) => {
    switch (level) {
      case 'Desenvolver':
        return 'text-error';
      case 'Adequado':
        return 'text-extra';
      case 'Satisfatório':
        return 'text-secondary';
      default:
        return 'text-white';
    }
  };

  const getHelpColor = (level: HelpLevel) => {
    if (level.startsWith('Verbal')) return 'text-verbal';
    if (level.startsWith('Exemplo')) return 'text-example';
    if (level.startsWith('Físico')) return 'text-physical';
    return 'text-white';
  };

  return (
    <View className="w-[200px] px-5 py-3.5 bg-level2 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl shadow-panelShadow outline outline-1 outline-offset-[-1px] outline-outline flex flex-col justify-start items-start gap-3.5">
      <Text className="text-muted text-default-3">
        {session.date}
      </Text>

      {visibleExercises.map((ex) => (
        <View key={ex.id} className="flex flex-col justify-start items-start gap-1">
          <Text className="text-white text-default-1">
            {ex.name}
          </Text>

          {mode === 'performance' && ex.performanceLevel && (
            <Text className={`${getPerformanceColor(ex.performanceLevel)} text-default-2`}>
              {ex.performanceLevel}
            </Text>
          )}

          {mode === 'performance' && ex.crises && ex.crises.length > 0 && (
            ex.crises.map((criseDuration, index) => (
              <Text key={index} className="text-muted text-default-2">
                Crise ({index + 1}): {criseDuration}s
              </Text>
            ))
          )}

          {mode === 'help' && ex.helpLevels && ex.helpLevels.length > 0 && (
              ex.helpLevels.map((help, index) => (
                <Text key={index} className={`${getHelpColor(help)} text-default-2`}>
                  {help}
                </Text>
              ))
          )}
        </View>
      ))}
    </View>
  );
}