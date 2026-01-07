/**
 * API Response Optimization Utilities
 * Reduces egress by limiting data sent to clients
 */

/**
 * Fields to include when returning user data in responses
 */
export const userSelectFields = {
    minimal: {
        id: true,
        name: true,
        displayName: true,
        avatarUrl: true,
    },
    basic: {
        id: true,
        name: true,
        displayName: true,
        avatarUrl: true,
        trophies: true,
        level: true,
        membershipType: true,
    },
    profile: {
        id: true,
        name: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        trophies: true,
        level: true,
        createdAt: true,
        membershipType: true,
        equippedBadge: true,
        equippedColor: true,
    },
    full: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        points: true,
        trophies: true,
        zions: true,
        level: true,
        xp: true,
        membershipType: true,
        createdAt: true,
        ownedCustomizations: true,
        equippedBackground: true,
        equippedBadge: true,
        equippedColor: true,
        liteMode: true,
    }
};

/**
 * Fields to include when returning post data
 */
export const postSelectFields = {
    feed: {
        id: true,
        imageUrl: true,
        caption: true,
        likesCount: true,
        commentsCount: true,
        createdAt: true,
        userId: true,
    },
    full: {
        id: true,
        imageUrl: true,
        videoUrl: true,
        caption: true,
        likesCount: true,
        commentsCount: true,
        mediaType: true,
        isHighlight: true,
        createdAt: true,
        userId: true,
    }
};

/**
 * Pagination helper to limit data returned
 */
export const getPagination = (page?: string | number, limit?: string | number) => {
    const pageNum = typeof page === 'string' ? parseInt(page) || 1 : (page || 1);
    const limitNum = typeof limit === 'string' ? parseInt(limit) || 10 : (limit || 10);
    
    // Cap limit at 50 to prevent large data transfers
    const cappedLimit = Math.min(limitNum, 50);
    
    return {
        skip: (pageNum - 1) * cappedLimit,
        take: cappedLimit,
    };
};

/**
 * Strip large fields from response objects
 */
export const stripLargeFields = <T extends Record<string, any>>(
    obj: T,
    fieldsToRemove: string[] = []
): Partial<T> => {
    const result = { ...obj };
    
    for (const field of fieldsToRemove) {
        if (field in result) {
            delete result[field];
        }
    }
    
    return result;
};

/**
 * Truncate string fields to max length
 */
export const truncateFields = <T extends Record<string, any>>(
    obj: T,
    maxLengths: Record<string, number>
): T => {
    const result = { ...obj } as Record<string, any>;
    
    for (const [field, maxLength] of Object.entries(maxLengths)) {
        if (typeof result[field] === 'string' && result[field].length > maxLength) {
            result[field] = result[field].substring(0, maxLength) + '...';
        }
    }
    
    return result as T;
};
