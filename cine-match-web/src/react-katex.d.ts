declare module 'react-katex' {
  import { ReactNode } from 'react';

  interface KatexProps {
    children?: string | ReactNode;
    math?: string;
    block?: boolean;
    errorColor?: string;
  }

  export const InlineMath: React.FC<KatexProps>;
  export const BlockMath: React.FC<KatexProps>;
}
