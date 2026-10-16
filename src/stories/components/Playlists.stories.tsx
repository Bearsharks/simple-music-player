import { StoryFn, Meta } from '@storybook/react';
import Playlists from 'features/playlists/ui/playlists/Playlists';
import { Provider } from 'jotai';
import { playlistInfosFixture } from 'test/fixture';
export default {
    title: 'components/Playlists',
    component: Playlists,
    argTypes: {
        playPlaylist: { action: 'clicked' },
        openOptionsSelector: { action: 'clicked' },
        openCreatePlaylistPopup: { action: 'clicked' },
        goToPlaylistPage: { action: 'clicked' },
    },
} as Meta<typeof Playlists>;

const Template: StoryFn<typeof Playlists> = (args) => <Provider><Playlists {...args} /></Provider>;

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
