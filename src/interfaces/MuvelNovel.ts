export type muvelNovel = {
    tags: string[]
    id: string
    title: string
    description: string
    thumbnail: string | ''
    share: number
    createdAt: string
    updatedAt: string
    author: muvelNovelAuthor
    episodeIds: string[]
}

type muvelNovelAuthor = {
    id: string
    username: string
    avatar: string
    admin: boolean
}