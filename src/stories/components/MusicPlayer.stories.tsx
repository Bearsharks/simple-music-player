import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import * as MusicListStories from './MusicList.stories';
import MusicPlayer from '../../components/MusicPlayer';

export default {
    title: 'components/MusicPlayer',
    component: MusicPlayer,
} as ComponentMeta<typeof MusicPlayer>;

const Template: ComponentStory<typeof MusicPlayer> = (args) => <MusicPlayer {...args} />;

export const Default = Template.bind({});
Default.args = {
    ...MusicListStories.Inited.args,
    children: <div>플레이어</div>
};
