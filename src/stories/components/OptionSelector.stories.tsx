import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import OptionSelector from 'shared/ui/OptionSelector';
import { Provider } from 'jotai';
import { options } from 'test/fixture';
export default {
    title: 'shared/ui/OptionSelector',
    component: OptionSelector,
    argTypes: { openPopUpBox: { action: 'clicked' } },
} as Meta<typeof OptionSelector>;

const Template: StoryFn<typeof OptionSelector> = (args) => <Provider><OptionSelector {...args} /></Provider>;

export const Inited = Template.bind({});
Inited.args = {
    options: options
};
