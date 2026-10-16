import { StoryFn, Meta } from '@storybook/react';
import PlayerController from 'features/player/ui/playerController/PlayerController';
import { Provider } from 'jotai';
import { musicInfosFixture } from 'test/fixture';
export default {
    title: 'components/PlayerController',
    component: PlayerController,
    argTypes: {
        goNext: { action: 'clicked' }, goPrev: { action: 'clicked' }
        , togglePlayState: { action: 'clicked' }
        , togglePlayerVisiblity: { action: 'clicked' }
    },
} as Meta<typeof PlayerController>;

const Template: StoryFn<typeof PlayerController> = (args) => <Provider><PlayerController {...args} /></Provider>;

export const Inited = Template.bind({});
Inited.args = {
    playerVisiblity: false,
    musicInfo: musicInfosFixture[0],
    isPlaying: false
};

export const Detail = Template.bind({});
Detail.args = {
    playerVisiblity: true,
    musicInfo: musicInfosFixture[0],
    isPlaying: true
};
