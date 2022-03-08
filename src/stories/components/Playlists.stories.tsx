import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Playlists from 'components/Playlists/Playlists';

export default {
    title: 'components/Playlists',
    component: Playlists,
    argTypes: { openPopUpBox: { action: 'clicked' } },
} as ComponentMeta<typeof Playlists>;

const Template: ComponentStory<typeof Playlists> = (args) => <Playlists {...args} />;

export const Inited = Template.bind({});
Inited.args = {
    playlistInfos: []
};
