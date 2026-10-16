import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import MusicList from 'features/queue/ui/musicList/MusicList';
import { Provider } from 'jotai';
import { musicInfosFixture } from 'test/fixture';

export default {
    title: 'components/MusicList',
    component: MusicList,
    argTypes: {
        openOptionsPopup: { action: 'clicked' },
        playMusic: { action: 'clicked' },
        changeOrder: { action: 'clicked' },
    },
} as Meta<typeof MusicList>;

const Template: StoryFn<typeof MusicList> = (args) => <Provider><MusicList {...args} /></Provider>;

export const Inited = Template.bind({});
Inited.args = {
    items: musicInfosFixture
};
