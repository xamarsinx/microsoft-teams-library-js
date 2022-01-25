import { app } from '../../src/public/app';
import { DialogDimension, FrameContexts } from '../../src/public/constants';
import { dialog } from '../../src/public/dialog';
import { DialogInfo } from '../../src/public/interfaces';
import { Utils } from '../utils';

describe('Dialog', () => {
  // Use to send a mock message from the app.

  const utils = new Utils();

  beforeEach(() => {
    utils.processMessage = null;
    utils.messages = [];
    utils.childMessages = [];
    utils.childWindow.closed = false;
  });

  afterEach(() => {
    // Reset the object since it's a singleton
    if (app._uninitialize) {
      app._uninitialize();
    }
  });

  describe('open', () => {
    it('should not allow calls before initialization', () => {
      const dialogInfo: DialogInfo = {};
      expect(() => dialog.open(dialogInfo)).toThrowError('The library has not yet been initialized');
    });

    const allowedContexts = [FrameContexts.content, FrameContexts.sidePanel, FrameContexts.meetingStage];

    Object.keys(FrameContexts).forEach(k => {
      const context = FrameContexts[k];
      if (allowedContexts.some(allowedContext => allowedContext === context)) {
        it(`should allow calls from ${context} context`, async () => {
          await utils.initializeWithContext(context);

          const dialogInfo: DialogInfo = {};
          expect(() => dialog.open(dialogInfo)).not.toThrowError();
        });
      } else {
        it(`should not allow calls from ${context} context`, async () => {
          await utils.initializeWithContext(context);

          const dialogInfo: DialogInfo = {};
          expect(() => dialog.open(dialogInfo)).toThrowError(
            `This call is only allowed in following contexts: ["content","sidePanel","meetingStage"]. Current context: "${context}".`,
          );
        });
      }
    });

    it('should pass along entire DialogInfo parameter in sidePanel context', async () => {
      await utils.initializeWithContext(FrameContexts.sidePanel);

      const dialogInfo: DialogInfo = {
        card: 'someCard',
        fallbackUrl: 'someFallbackUrl',
        height: DialogDimension.Large,
        width: DialogDimension.Large,
        title: 'someTitle',
        url: 'someUrl',
        completionBotId: 'someCompletionBotId',
      };

      dialog.open(dialogInfo, () => {
        return;
      });

      const openMessage = utils.findMessageByFunc('tasks.startTask');
      expect(openMessage).not.toBeNull();
      expect(openMessage.args).toEqual([dialogInfo]);
    });

    it('should pass along entire DialogInfo parameter in content context', async () => {
      await utils.initializeWithContext(FrameContexts.content);

      const dialogInfo: DialogInfo = {
        card: 'someCard',
        fallbackUrl: 'someFallbackUrl',
        height: DialogDimension.Large,
        width: DialogDimension.Large,
        title: 'someTitle',
        url: 'someUrl',
        completionBotId: 'someCompletionBotId',
      };

      dialog.open(dialogInfo, () => {
        return;
      });

      const openMessage = utils.findMessageByFunc('tasks.startTask');
      expect(openMessage).not.toBeNull();
      expect(openMessage.args).toEqual([dialogInfo]);
    });

    it('should invoke callback with result', async () => {
      expect.assertions(4);
      await utils.initializeWithContext(FrameContexts.content);

      let callbackCalled = false;
      const dialogInfo: DialogInfo = {};
      dialog.open(dialogInfo, (err, result) => {
        expect(err).toBeNull();
        expect(result).toBe('someResult');
        callbackCalled = true;
      });

      const openMessage = utils.findMessageByFunc('tasks.startTask');
      expect(openMessage).not.toBeNull();
      utils.respondToMessage(openMessage, null, 'someResult');
      expect(callbackCalled).toBe(true);
    });

    it('should invoke callback with error', async () => {
      expect.assertions(4);
      await utils.initializeWithContext(FrameContexts.content);

      let callbackCalled = false;
      const dialogInfo: DialogInfo = {};
      dialog.open(dialogInfo, (err, result) => {
        expect(err).toBe('someError');
        expect(result).toBeUndefined();
        callbackCalled = true;
      });

      const openMessage = utils.findMessageByFunc('tasks.startTask');
      expect(openMessage).not.toBeNull();
      utils.respondToMessage(openMessage, 'someError');
      expect(callbackCalled).toBe(true);
    });
  });

  describe('resize', () => {
    it('should not allow calls before initialization', () => {
      // tslint:disable-next-line:no-any
      expect(() => dialog.resize({} as any)).toThrowError('The library has not yet been initialized');
    });

    const allowedContexts = [FrameContexts.task];

    Object.keys(FrameContexts).forEach(k => {
      const context = FrameContexts[k];
      if (allowedContexts.some(allowedContext => allowedContext === context)) {
        it(`should allow calls from ${context} context`, async () => {
          await utils.initializeWithContext(context);

          const dialogInfo: DialogInfo = {};
          expect(() => dialog.resize(dialogInfo)).not.toThrowError();
        });
      } else {
        it(`should not allow calls from ${context} context`, async () => {
          await utils.initializeWithContext(context);

          const dialogInfo: DialogInfo = {};
          expect(() => dialog.resize(dialogInfo)).toThrowError(
            `This call is only allowed in following contexts: ["task"]. Current context: "${context}".`,
          );
        });
      }
    });

    it('should successfully pass DialogInfo in Task context', async () => {
      await utils.initializeWithContext(FrameContexts.task);
      const dialogInfo = { width: 10, height: 10 };

      dialog.resize(dialogInfo);

      const resizeMessage = utils.findMessageByFunc('tasks.updateTask');
      expect(resizeMessage).not.toBeNull();
      expect(resizeMessage.args).toEqual([dialogInfo]);
    });

    it('should throw an error if extra properties are provided', async () => {
      await utils.initializeWithContext(FrameContexts.task);
      const dialogInfo = { width: 10, height: 10, title: 'anything' };

      expect(() => dialog.resize(dialogInfo)).toThrowError(
        'resize requires a dialogInfo argument containing only width and height',
      );
    });
  });

  describe('submit', () => {
    it('should not allow calls before initialization', () => {
      expect(() => dialog.submit()).toThrowError('The library has not yet been initialized');
    });

    const allowedContexts = [FrameContexts.task];

    Object.keys(FrameContexts).forEach(k => {
      const context = FrameContexts[k];

      if (allowedContexts.some(allowedContext => allowedContext === context)) {
        it(`should allow calls from ${context} context`, async () => {
          await utils.initializeWithContext(context);

          expect(() => dialog.submit()).not.toThrowError();
        });
      } else {
        it(`should not allow calls from ${context} context`, async () => {
          await utils.initializeWithContext(context);

          expect(() => dialog.submit()).toThrowError(
            `This call is only allowed in following contexts: ["task"]. Current context: "${context}".`,
          );
        });
      }
    });

    it('should successfully pass result and appIds parameters when called from Task context', async () => {
      await utils.initializeWithContext(FrameContexts.task);

      dialog.submit('someResult', ['someAppId', 'someOtherAppId']);

      const submitMessage = utils.findMessageByFunc('tasks.completeTask');
      expect(submitMessage).not.toBeNull();
      expect(submitMessage.args).toEqual(['someResult', ['someAppId', 'someOtherAppId']]);
    });

    it('should handle a single string passed as appIds parameter', async () => {
      await utils.initializeWithContext(FrameContexts.task);

      dialog.submit('someResult', 'someAppId');

      const submitMessage = utils.findMessageByFunc('tasks.completeTask');
      expect(submitMessage).not.toBeNull();
      expect(submitMessage.args).toEqual(['someResult', ['someAppId']]);
    });
  });
});
