import type { Difficulty } from '../core/types';
import type { BoardLayout } from '../canvas/layout';
import checkedIcon from '../ui/assets/checked.png';

interface MenuActions {
  readonly onNewGame: () => void;
  readonly onChangeDifficulty: (difficulty: Difficulty) => void;
  readonly onToggleMarks?: (enabled: boolean) => void;
  readonly onToggleColor?: (enabled: boolean) => void;
  readonly onToggleSound?: (enabled: boolean) => void;
  readonly onCustomDifficulty?: () => void;
  readonly onBestTimes?: () => void;
  readonly onOpenContentsHelp?: () => void;
  readonly onSearchHelp?: () => void;
  readonly onUsingHelp?: () => void;
  readonly onAbout?: () => void;
  readonly onGithub?: () => void;
  readonly onExit?: () => void;
}

interface MenuOptions {
  readonly initialDifficulty: Difficulty;
  readonly initialMarksEnabled?: boolean;
  readonly initialColorEnabled?: boolean;
  readonly initialSoundEnabled?: boolean;
}

export interface MenuSession {
  readonly dispose: () => void;
  readonly setDifficulty: (difficulty: Difficulty) => void;
  readonly setMarksEnabled: (enabled: boolean) => void;
  readonly setColorEnabled: (enabled: boolean) => void;
  readonly setSoundEnabled: (enabled: boolean) => void;
  readonly setLayout: (layout: BoardLayout) => void;
}

const MENU_MARKS = {
  Beginner: 'Beginner',
  Intermediate: 'Intermediate',
  Expert: 'Expert',
} as const;

function formatDifficultyLabel(difficulty: Difficulty): string {
  return MENU_MARKS[difficulty];
}

export function createMinesweeperMenu(
  root: HTMLElement,
  actions: MenuActions,
  options: MenuOptions,
): MenuSession {
  let currentDifficulty = options.initialDifficulty;
  let marksEnabled = options.initialMarksEnabled ?? true;
  let colorEnabled = options.initialColorEnabled ?? false;
  let soundEnabled = options.initialSoundEnabled ?? true;
  let openedMenu: 'game' | 'help' | null = null;

  const menu = document.createElement('div');
  menu.className = 'ms-menu';
  menu.style.left = '0px';
  menu.style.top = '0px';

  const topBar = document.createElement('div');
  topBar.className = 'ms-menu__topbar';

  const gameButton = document.createElement('div');
  gameButton.className = 'ms-menu__item';
  gameButton.textContent = 'Game';

  const helpButton = document.createElement('div');
  helpButton.className = 'ms-menu__item';
  helpButton.textContent = 'Help';

  const gamePanel = document.createElement('div');
  gamePanel.className = 'ms-menu__panel ms-menu__panel--game';
  gamePanel.style.left = '0px';
  gamePanel.style.top = '20px';
  gamePanel.style.display = 'none';

  const helpPanel = document.createElement('div');
  helpPanel.className = 'ms-menu__panel ms-menu__panel--help';
  helpPanel.style.top = '20px';
  helpPanel.style.display = 'none';

  const setOpened = (name: 'game' | 'help' | null): void => {
    openedMenu = name;
    gamePanel.style.display = name === 'game' ? 'grid' : 'none';
    helpPanel.style.display = name === 'help' ? 'grid' : 'none';

    gameButton.classList.toggle('is-open', name === 'game');
    helpButton.classList.toggle('is-open', name === 'help');
  };

  const setRowContent = (
    row: HTMLElement,
    label: string,
    checked = false,
    hotkey = '',
  ): void => {
    const check = document.createElement('span');
    check.className = 'ms-menu__check';
    if (checked) {
      const image = document.createElement('img');
      image.src = checkedIcon;
      image.alt = '';
      check.appendChild(image);
    }
    const text = document.createElement('span');
    text.className = 'ms-menu__label';
    text.textContent = label;
    const shortcut = document.createElement('span');
    shortcut.className = 'ms-menu__hotkey';
    shortcut.textContent = hotkey;
    const arrow = document.createElement('span');
    arrow.className = 'ms-menu__arrow';
    row.replaceChildren(check, text, shortcut, arrow);
  };

  const createRow = (text: string, action?: () => void, isDisabled = false): HTMLDivElement => {
    const row = document.createElement('div');
    row.className = 'ms-menu__row';
    row.setAttribute('aria-disabled', `${isDisabled}`);
    if (action) {
      row.addEventListener('click', event => {
        event.preventDefault();
        action();
        setOpened(null);
      });
    }
    setRowContent(row, text);
    return row;
  };

  const createToggleRow = (
    label: string,
    checked: boolean,
    action: (next: boolean) => void,
  ): HTMLDivElement => {
    const row = createRow(label, () => {
      const next = !checked;
      checked = next;
      action(next);
      syncState();
    });
    row.dataset.toggle = label;
    setRowContent(row, label, checked);
    return row;
  };

  const createDifficultyRow = (difficulty: Difficulty): HTMLDivElement => {
    const row = createRow(
      formatDifficultyLabel(difficulty),
      () => {
        currentDifficulty = difficulty;
        actions.onChangeDifficulty(difficulty);
      },
      false,
    );
    row.dataset.difficulty = difficulty;
    setRowContent(row, formatDifficultyLabel(difficulty), difficulty === currentDifficulty);
    return row;
  };

  const newRow = createRow('New', () => {
    actions.onNewGame();
  });
  setRowContent(newRow, 'New', false, 'F2');
  const beginnerRow = createDifficultyRow('Beginner');
  const intermediateRow = createDifficultyRow('Intermediate');
  const expertRow = createDifficultyRow('Expert');
  const separator1 = document.createElement('div');
  separator1.className = 'ms-menu__separator';

  gamePanel.appendChild(newRow);
  gamePanel.appendChild(separator1);
  gamePanel.appendChild(beginnerRow);
  gamePanel.appendChild(intermediateRow);
  gamePanel.appendChild(expertRow);

  const customRow = createRow('Custom...', () => {
    actions.onCustomDifficulty?.();
    setOpened(null);
  });

  const marksRow = createToggleRow('Marks (?)', marksEnabled, next => {
    marksEnabled = next;
    actions.onToggleMarks?.(next);
  });

  const colorRow = createToggleRow('Color', colorEnabled, next => {
    colorEnabled = next;
    actions.onToggleColor?.(next);
  });

  const soundRow = createToggleRow('Sound', soundEnabled, next => {
    soundEnabled = next;
    actions.onToggleSound?.(next);
  });

  const scoresRow = createRow('Best Times...', () => {
    actions.onBestTimes?.();
    setOpened(null);
  });

  const exitRow = createRow('Exit', () => {
    actions.onExit?.();
    setOpened(null);
  });

  gamePanel.appendChild(customRow);
  gamePanel.appendChild(separator1.cloneNode(true));
  [marksRow, colorRow, soundRow].forEach(row => gamePanel.appendChild(row));
  gamePanel.appendChild(document.createElement('div')).className = 'ms-menu__separator';
  gamePanel.appendChild(scoresRow);
  gamePanel.appendChild(document.createElement('div')).className = 'ms-menu__separator';
  gamePanel.appendChild(exitRow);

  const helpRow1 = createRow('Contents', () => {
    actions.onOpenContentsHelp?.();
    setOpened(null);
  });
  setRowContent(helpRow1, 'Contents', false, 'F1');
  const helpRow2 = createRow('Search for Help on...', () => {
    actions.onSearchHelp?.();
    setOpened(null);
  });
  const helpRow3 = createRow('Using Help', () => {
    actions.onUsingHelp?.();
    setOpened(null);
  });
  const helpSep1 = document.createElement('div');
  helpSep1.className = 'ms-menu__separator';
  const helpRow4 = createRow('About Minesweeper...', () => {
    actions.onAbout?.();
    setOpened(null);
  });

  const helpLink = createRow('GitHub', () => {
    actions.onGithub?.();
    setOpened(null);
  }, false);

  const syncState = (): void => {
    setRowContent(marksRow, 'Marks (?)', marksEnabled);
    setRowContent(colorRow, 'Color', colorEnabled);
    setRowContent(soundRow, 'Sound', soundEnabled);
  };

  const setLayout = (layout: BoardLayout): void => {
    const width = Math.max(1, layout.topBar.width);
    const left = Math.max(0, layout.topBar.x);
    const scale = Math.max(0.5, layout.cellSize / 16);
    const menuBarHeight = Math.max(1, Math.round(20 * scale));

    menu.style.left = `${left}px`;
    menu.style.top = `${Math.max(0, layout.topBar.y)}px`;
    menu.style.width = `${width}px`;
    menu.style.setProperty('--ms-scale', `${scale}`);

    topBar.style.width = `${width}px`;
    topBar.style.height = `${menuBarHeight}px`;
    gamePanel.style.left = '0px';
    helpPanel.style.left = `${Math.max(0, Math.round(gameButton.offsetWidth))}px`;
    gamePanel.style.top = `${menuBarHeight}px`;
    helpPanel.style.top = `${menuBarHeight}px`;
  };

  helpPanel.appendChild(helpRow1);
  helpPanel.appendChild(helpRow2);
  helpPanel.appendChild(helpRow3);
  helpPanel.appendChild(helpSep1);
  helpPanel.appendChild(helpRow4);
  helpPanel.appendChild(helpLink);

  const toggleGame = (): void => {
    setOpened(openedMenu === 'game' ? null : 'game');
  };
  const toggleHelp = (): void => {
    setOpened(openedMenu === 'help' ? null : 'help');
  };

  gameButton.addEventListener('click', event => {
    event.stopPropagation();
    toggleGame();
  });
  helpButton.addEventListener('click', event => {
    event.stopPropagation();
    toggleHelp();
  });

  menu.addEventListener('click', event => {
    event.stopPropagation();
  });

  const handleDocumentPointer = (event: Event): void => {
    if (!(event.target instanceof Node)) return;
    if (menu.contains(event.target)) return;
    setOpened(null);
  };

  document.addEventListener('pointerdown', handleDocumentPointer, { capture: true });

  topBar.appendChild(gameButton);
  topBar.appendChild(helpButton);
  menu.appendChild(topBar);
  menu.appendChild(gamePanel);
  menu.appendChild(helpPanel);
  root.appendChild(menu);

  const syncDifficultyState = (): void => {
    setRowContent(beginnerRow, formatDifficultyLabel('Beginner'), currentDifficulty === 'Beginner');
    setRowContent(intermediateRow, formatDifficultyLabel('Intermediate'), currentDifficulty === 'Intermediate');
    setRowContent(expertRow, formatDifficultyLabel('Expert'), currentDifficulty === 'Expert');
    syncState();
  };

  syncDifficultyState();

  return {
    setDifficulty: difficulty => {
      currentDifficulty = difficulty;
      syncDifficultyState();
    },
    setMarksEnabled: enabled => {
      marksEnabled = enabled;
      actions.onToggleMarks?.(enabled);
      syncState();
    },
    setColorEnabled: enabled => {
      colorEnabled = enabled;
      actions.onToggleColor?.(enabled);
      syncState();
    },
    setSoundEnabled: enabled => {
      soundEnabled = enabled;
      actions.onToggleSound?.(enabled);
      syncState();
    },
    setLayout,
    dispose: () => {
      document.removeEventListener('pointerdown', handleDocumentPointer, true);
      menu.remove();
    },
  };
}
