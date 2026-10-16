import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import OptionSelector from 'shared/ui/OptionSelector';
import { RecoilRoot } from 'recoil';
import { options } from 'test/fixture';
export default {
    title: 'shared/ui/OptionSelector',
    component: OptionSelector,
    argTypes: { openPopUpBox: { action: 'clicked' } },
} as ComponentMeta<typeof OptionSelector>;

const Template: ComponentStory<typeof OptionSelector> = (args) => <RecoilRoot><OptionSelector {...args} /></RecoilRoot>;

export const Inited = Template.bind({});
Inited.args = {
    options: options
};
