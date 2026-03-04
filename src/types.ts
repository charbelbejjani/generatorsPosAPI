import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userid: number;
      username: string;
      group_id: number;
      groupname?: string;
      permissions: Record<number, number>;
      pages: number[];
      controls: number[];
    };
    pageContext?: {
      pageId: number;
      permission: string;
      permissionLevel: number;
    };
  }
}
