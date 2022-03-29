import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import MusicList from 'components/musicList/MusicList';
import { RecoilRoot } from 'recoil';
import { musicInfosFixture } from 'refs/fixture';

export default {
    title: 'components/MusicList',
    component: MusicList,
    argTypes: {
        openOptionsPopup: { action: 'clicked' },
        playMusic: { action: 'clicked' },
        changeOrder: { action: 'clicked' },
    },
} as ComponentMeta<typeof MusicList>;

const Template: ComponentStory<typeof MusicList> = (args) => <RecoilRoot><MusicList {...args} /></RecoilRoot>;

export const Inited = Template.bind({});
Inited.args = {
    items: musicInfosFixture
};
