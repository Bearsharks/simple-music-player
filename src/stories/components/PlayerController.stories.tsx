import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import PlayerController from 'components/playerController/PlayerController';

export default {
    title: 'components/PlayerController',
    component: PlayerController,
    argTypes: { openPopUpBox: { action: 'clicked' } },
} as ComponentMeta<typeof PlayerController>;

const Template: ComponentStory<typeof PlayerController> = (args) => <PlayerController {...args} />;

export const Inited = Template.bind({});
Inited.args = {

};
