import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import OptionSelector from 'shared/ui/OptionSelector';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "shared/ui/shadcn/dropdown-menu";
import { Button } from "shared/ui/shadcn/button";
import { options } from 'test/fixture';
export default {
    title: 'shared/ui/OptionSelector',
    component: OptionSelector,
    argTypes: { openPopUpBox: { action: 'clicked' } },
} as Meta<typeof OptionSelector>;

const Template: StoryFn<typeof OptionSelector> = (args) => <DropdownMenu modal={false}><DropdownMenuTrigger asChild><Button variant="secondary">선택 메뉴</Button></DropdownMenuTrigger><DropdownMenuContent><OptionSelector {...args} /></DropdownMenuContent></DropdownMenu>;

export const Inited = Template.bind({});
Inited.args = {
    options: options
};
