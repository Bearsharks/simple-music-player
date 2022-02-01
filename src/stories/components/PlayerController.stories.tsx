import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { musicListFixture } from './fixture/fixture';
import PlayerController from '../../components/PlayerController';

export default {
    title: 'components/PlayerController',
    component: PlayerController,
    argTypes: { openPopUpBox: { action: 'clicked' } },
} as ComponentMeta<typeof PlayerController>;

const Template: ComponentStory<typeof PlayerController> = (args) => <PlayerController {...args} />;

export const Inited = Template.bind({});
Inited.args = {
    musicInfo: musicListFixture[0]
};
