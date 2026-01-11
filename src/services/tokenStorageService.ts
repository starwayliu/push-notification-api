import { DeviceToken, Platform } from '../types';

/**
 * Device Token 存储服务
 * 注意：这是内存存储实现，生产环境建议使用数据库（如 MongoDB、PostgreSQL 等）
 */
export class TokenStorageService {
  private tokens: Map<string, DeviceToken> = new Map();
  private userTokens: Map<string, Set<string>> = new Map(); // userId -> Set<tokenId>

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 注册/保存 device token
   */
  registerToken(userId: string | undefined, platform: Platform, token: string): DeviceToken {
    const now = new Date().toISOString();
    
    // 检查是否已存在相同的 token
    const existingToken = Array.from(this.tokens.values()).find(
      (t) => t.token === token && t.platform === platform
    );

    let tokenId: string;
    let deviceToken: DeviceToken;

    if (existingToken) {
      // 更新现有 token
      tokenId = existingToken.id;
      deviceToken = {
        ...existingToken,
        userId: userId || existingToken.userId,
        updatedAt: now,
      };
    } else {
      // 创建新 token
      tokenId = this.generateId();
      deviceToken = {
        id: tokenId,
        userId,
        platform,
        token,
        createdAt: now,
        updatedAt: now,
      };
    }

    this.tokens.set(tokenId, deviceToken);

    // 如果提供了 userId，添加到用户 token 映射
    if (userId) {
      if (!this.userTokens.has(userId)) {
        this.userTokens.set(userId, new Set());
      }
      this.userTokens.get(userId)!.add(tokenId);
    }

    return deviceToken;
  }

  /**
   * 根据 ID 获取 token
   */
  getTokenById(tokenId: string): DeviceToken | undefined {
    return this.tokens.get(tokenId);
  }

  /**
   * 根据用户 ID 获取所有 tokens
   */
  getTokensByUserId(userId: string): DeviceToken[] {
    const tokenIds = this.userTokens.get(userId);
    if (!tokenIds) {
      return [];
    }

    return Array.from(tokenIds)
      .map((id) => this.tokens.get(id))
      .filter((token): token is DeviceToken => token !== undefined);
  }

  /**
   * 根据平台获取所有 tokens
   */
  getTokensByPlatform(platform: Platform): DeviceToken[] {
    return Array.from(this.tokens.values()).filter((token) => token.platform === platform);
  }

  /**
   * 获取所有 tokens
   */
  getAllTokens(userId?: string, platform?: Platform): DeviceToken[] {
    let tokens = Array.from(this.tokens.values());

    if (userId) {
      tokens = tokens.filter((token) => token.userId === userId);
    }

    if (platform) {
      tokens = tokens.filter((token) => token.platform === platform);
    }

    return tokens;
  }

  /**
   * 删除 token
   */
  deleteToken(tokenId: string): boolean {
    const token = this.tokens.get(tokenId);
    if (!token) {
      return false;
    }

    // 从用户 token 映射中移除
    if (token.userId) {
      const userTokenSet = this.userTokens.get(token.userId);
      if (userTokenSet) {
        userTokenSet.delete(tokenId);
        if (userTokenSet.size === 0) {
          this.userTokens.delete(token.userId);
        }
      }
    }

    // 从 tokens 映射中移除
    this.tokens.delete(tokenId);
    return true;
  }

  /**
   * 删除用户的所有 tokens
   */
  deleteTokensByUserId(userId: string): number {
    const tokenIds = this.userTokens.get(userId);
    if (!tokenIds) {
      return 0;
    }

    const count = tokenIds.size;
    tokenIds.forEach((tokenId) => {
      this.tokens.delete(tokenId);
    });
    this.userTokens.delete(userId);

    return count;
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    total: number;
    byPlatform: Record<Platform, number>;
    byUser: number;
  } {
    const tokens = Array.from(this.tokens.values());
    const byPlatform: Record<Platform, number> = {
      web: 0,
      android: 0,
    };

    tokens.forEach((token) => {
      byPlatform[token.platform]++;
    });

    return {
      total: tokens.length,
      byPlatform,
      byUser: this.userTokens.size,
    };
  }
}

// 导出单例实例
export const tokenStorage = new TokenStorageService();
