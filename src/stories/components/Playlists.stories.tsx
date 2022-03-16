import { ComponentStory, ComponentMeta } from '@storybook/react';
import Playlists from 'components/playlists/Playlists';
import { RecoilRoot } from 'recoil';
import { playlistInfosFixture } from 'refs/fixture';
export default {
    title: 'components/Playlists',
    component: Playlists,
    argTypes: {
        playPlaylist: { action: 'clicked' },
        openOptionsSelector: { action: 'clicked' },
        openCreatePlaylistPopup: { action: 'clicked' },
        goToPlaylistPage: { action: 'clicked' },
    },
} as ComponentMeta<typeof Playlists>;

const Template: ComponentStory<typeof Playlists> = (args) => <RecoilRoot><Playlists {...args} /></RecoilRoot>;

export const Inited = Template.bind({});
Inited.args = {
    playlistInfos: []
};

export const few = Template.bind({});
few.args = {
    playlistInfos: playlistInfosFixture.slice(1)
};

export const many = Template.bind({});
many.args = {
    playlistInfos: playlistInfosFixture
};
