import axios, { AxiosResponse } from 'axios'
import { Extension, applicationCommand, option } from '@pikokr/command.ts'
import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import { checkKimustoryCommunityLounge } from './Hello'
import { muvelNovel } from '../interfaces/MuvelNovel'
import { TrimUserId } from '../services/TrimUsername'

const muvelUrl: string = 'https://muvel.kimustory.net'
const muvelApi: string = `${muvelUrl}/api`
const muvelApiNovels: string = `${muvelApi}/novels`
const muvelApiNovelsTitle: string = `${muvelApiNovels}?title=`

class MuvelExtension extends Extension {
    @applicationCommand({
        name: 'muvelSearch',
        nameLocalizations: { ko: '뮤블검색' },
        type: ApplicationCommandType.ChatInput,
        description: 'Tell you the search result from Muvel',
        descriptionLocalizations: { ko: '뮤블에 올라와 있는 소설의 검색 결과를 받아서 알려줘요' }
    })
    async muvelSearch(
        i: ChatInputCommandInteraction,
        @option({
            type: ApplicationCommandOptionType.String,
            name: 'Title',
            name_localizations: { ko: '제목' },
            description: "Please enter the title you're to search!",
            description_localizations: { ko: '소설의 제목을 입력해주세요!' },
            required: false,
        })
        title: string
    ) {
        if (checkKimustoryCommunityLounge(i)) return
        const url: string = (title) ? `${muvelApiNovelsTitle}${title}` : muvelApiNovels
        let novel: muvelNovel
        try {
            const result: AxiosResponse<muvelNovel[]> = await axios.get<muvelNovel[]>(url)
            novel = result.data[0]
        }
        catch (error) {
            return await i.reply('Muvel 서버에 연결하지 못했어요..')
        }
        if (!novel) {
            return await i.reply('검색 결과가 없어요.')
        }
        const embed: EmbedBuilder = new EmbedBuilder()
            .setTitle(novel.title)
            .setDescription(novel.description)
            .setURL(`${muvelUrl}/novels/${novel.id}`)
            .setAuthor({ name: `${TrimUserId(novel.author.username)} (${novel.author.id})`, iconURL: novel.author.avatar })
            .setThumbnail(novel.thumbnail)
            .addFields(
                { name: '생성 시각', value: novel.createdAt },
                { name: '수정 시각', value: novel.updatedAt }
            )
            .addFields(
                { name: '에피소드', value: novel.episodeIds.map((s) => '[' + s + '](' + muvelUrl + '/episodes/' + s + ')').join('\n') }
            )
            .setTimestamp()
            .setFooter({
                text: `소설 ID: ${novel.id} • 제공: Muvel - 당신의 이야기를 담은 작은 방`
            })
        await i.reply({ embeds: [embed] })
    }
}

export const setup = async () => { return new MuvelExtension() }
