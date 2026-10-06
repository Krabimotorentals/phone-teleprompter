import { useState } from 'react';
import { Editor } from './components/Editor';
import { Teleprompter } from './components/Teleprompter';
import type { AppSettings } from './lib/types';

type Screen = 'editor' | 'teleprompter';

function App() {
  const [screen, setScreen] = useState<Screen>('editor');
  const [script, setScript] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);

  if (screen === 'teleprompter' && settings) {
    return (
      <Teleprompter
        script={script}
        settings={settings}
        onExit={() => setScreen('editor')}
      />
    );
  }

  return (
    <Editor
      onStart={(s, cfg) => {
        setScript(s);
        setSettings(cfg);
        setScreen('teleprompter');
      }}
    />
  );
}

export default App;
