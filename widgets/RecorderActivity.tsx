import { Button, HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, frame, labelStyle, monospacedDigit, padding } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity } from 'expo-widgets';

export type RecorderProps = {
  startedAt: number;       // epoch ms
  pausedAt: number | null; // epoch ms, null while recording
};

const RecorderActivity = (props: RecorderProps) => {
  'widget';
  const paused = props.pausedAt !== null;
  const color = paused ? '#FF9F0A' : '#FF3B30';

  const Timer = ({ size, width }: { size: number; width?: number }) => (
    <Text
      timerInterval={{
        lower: new Date(props.startedAt),
        upper: new Date(props.startedAt + 24 * 60 * 60 * 1000),
      }}
      countsDown={false}
      pauseTime={paused ? new Date(props.pausedAt!) : undefined}
      modifiers={[
        font({ size, weight: 'semibold' }),
        monospacedDigit(),
        ...(width ? [frame({ width })] : []),
      ]}
    />
  );

  const Mic = <Image systemName="mic.fill" color={color} size={18} />;

  const Controls = ({ iconOnly }: { iconOnly?: boolean }) => (
    <HStack spacing={8} modifiers={iconOnly ? [labelStyle('iconOnly')] : []}>
      <Button
        label={paused ? 'Resume' : 'Pause'}
        systemImage={paused ? 'play.fill' : 'pause.fill'}
        target="toggle"
      />
      <Button label="Stop" systemImage="stop.fill" target="stop" />
    </HStack>
  );

  return {
    banner: (
      <HStack spacing={12} modifiers={[padding({ all: 16 })]}>
        {Mic}
        <VStack alignment="leading" spacing={2}>
          <Text modifiers={[font({ size: 13 }), foregroundStyle('#8E8E93')]}>
            {paused ? 'Paused' : 'Recording'}
          </Text>
          <Timer size={28} />
        </VStack>
        <Spacer />
        <Controls iconOnly />
      </HStack>
    ),
    compactLeading: Mic,
    compactTrailing: <Timer size={14} width={44} />,
    minimal: Mic,
    expandedLeading: Mic,
    expandedTrailing: <Timer size={18} width={64} />,
    expandedBottom: <Controls />,
  };
};

export default createLiveActivity('RecorderActivity', RecorderActivity);
