import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// kor26: 下帯の左下のハチ公を隠す仕組み。大きいハチ公が出る部品 (吹き出しの ScreenHachikoBalloon、
// hero filler の ScreenHeroIconFiller) が useHideBottomHachiko() を呼ぶと、出ているあいだ左下のハチ公が隠れる。
// 真偽値でなく数で持つのは、rotation の切り替えで出る側と消える側の effect の順番が
// どうなっても崩れないようにするため
type BottomHachikoContextData = {
  hidden: boolean;
  increment: () => void;
  decrement: () => void;
};

const BottomHachikoContext = createContext<BottomHachikoContextData>({
  hidden: false,
  increment: () => {},
  decrement: () => {},
});

export const BottomHachikoProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [count, setCount] = useState(0);
  const increment = useCallback(() => setCount((c) => c + 1), []);
  const decrement = useCallback(() => setCount((c) => c - 1), []);
  const value = useMemo(
    () => ({ hidden: count > 0, increment, decrement }),
    [count, increment, decrement]
  );

  return (
    <BottomHachikoContext.Provider value={value}>
      {children}
    </BottomHachikoContext.Provider>
  );
};

export function useBottomHachikoHidden() {
  return useContext(BottomHachikoContext).hidden;
}

export function useHideBottomHachiko() {
  const { increment, decrement } = useContext(BottomHachikoContext);
  useEffect(() => {
    increment();
    return () => decrement();
  }, [increment, decrement]);
}
