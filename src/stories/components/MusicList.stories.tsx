import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { musicListFixture } from './fixture/fixture';
import MusicList from '../../components/MusicList';

export default {
    title: 'components/MusicList',
    component: MusicList,
    argTypes: { openPopUpBox: { action: 'clicked' } },
} as ComponentMeta<typeof MusicList>;

const Template: ComponentStory<typeof MusicList> = (args) => <MusicList {...args} />;

export const Inited = Template.bind({});
Inited.args = {
    items: musicListFixture
};
