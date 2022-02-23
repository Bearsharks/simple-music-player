import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import OptionSelector from '../../components/OptionSelector';
export default {
    title: 'components/OptionSelector',
    component: OptionSelector,
    argTypes: { openPopUpBox: { action: 'clicked' } },
} as ComponentMeta<typeof OptionSelector>;

const Template: ComponentStory<typeof OptionSelector> = (args) => <OptionSelector {...args} />;

export const Inited = Template.bind({});
Inited.args = {
    options: []
};
