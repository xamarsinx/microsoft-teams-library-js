import { FrameContexts } from '../../src/public';
import { app } from '../../src/public/app';
import { pages } from '../../src/public/pages';
import { Utils } from '../utils';

describe('config', () => {
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

  const allowedContexts = [FrameContexts.settings, FrameContexts.remove];

  Object.keys(FrameContexts).forEach(k => {
    const context = FrameContexts[k];
    if (allowedContexts.some(allowedContext => allowedContext === context)) {
      it(`should allow calls from the ${context} context`, async () => {
        expect.assertions(1);
        await utils.initializeWithContext(context);

        return expect(() => pages.config.setValidityState(true)).not.toThrowError();
      });
    } else {
      it(`should not allow calls from the ${context} context`, async () => {
        expect.assertions(1);
        await utils.initializeWithContext(context);

        return expect(() => pages.config.setValidityState(true)).toThrowError(
          `This call is only allowed in following contexts: ["settings","remove"]. Current context: "${context}".`,
        );
      });
    }
  });

  it('should successfully notify success on save when there is no registered handler', async () => {
    await utils.initializeWithContext(FrameContexts.settings);

    utils.sendMessage('settings.save');

    const message = utils.findMessageByFunc('settings.save.success');
    expect(message).not.toBeNull();
    expect(message.args.length).toBe(0);
  });

  it('should successfully register a remove handler', async () => {
    await utils.initializeWithContext(FrameContexts.remove);

    let handlerCalled = false;
    pages.config.registerOnRemoveHandler(() => {
      handlerCalled = true;
    });

    utils.sendMessage('settings.remove');

    expect(handlerCalled).toBeTruthy();
  });

  it('should successfully set validity state to true', async () => {
    await utils.initializeWithContext(FrameContexts.settings);

    pages.config.setValidityState(true);

    const message = utils.findMessageByFunc('settings.setValidityState');
    expect(message).not.toBeNull();
    expect(message.args.length).toBe(1);
    expect(message.args[0]).toBe(true);
  });

  it('should successfully set validity state to false', async () => {
    await utils.initializeWithContext(FrameContexts.settings);

    pages.config.setValidityState(false);

    const message = utils.findMessageByFunc('settings.setValidityState');
    expect(message).not.toBeNull();
    expect(message.args.length).toBe(1);
    expect(message.args[0]).toBe(false);
  });

  it('should successfully get settings', async () => {
    expect.assertions(2);
    await utils.initializeWithContext(FrameContexts.settings);

    const promise = pages.getConfig();

    const message = utils.findMessageByFunc('settings.getSettings');
    expect(message).not.toBeNull();

    const expectedSettings: pages.InstanceConfig = {
      suggestedDisplayName: 'someSuggestedDisplayName',
      contentUrl: 'someContentUrl',
      websiteUrl: 'someWebsiteUrl',
      entityId: 'someEntityId',
    };

    utils.respondToMessage(message, expectedSettings);

    return expect(promise).resolves.toBe(expectedSettings);
  });

  it('should successfully set settings', async () => {
    await utils.initializeWithContext(FrameContexts.settings);

    const settingsObj: pages.InstanceConfig = {
      suggestedDisplayName: 'someSuggestedDisplayName',
      contentUrl: 'someContentUrl',
      websiteUrl: 'someWebsiteUrl',
      entityId: 'someEntityId',
    };
    pages.config.setConfig(settingsObj);

    const message = utils.findMessageByFunc('settings.setSettings');
    expect(message).not.toBeNull();
    expect(message.args.length).toBe(1);
    expect(message.args[0]).toBe(settingsObj);
  });

  it('should successfully register a save handler', async () => {
    await utils.initializeWithContext(FrameContexts.settings);

    let handlerCalled = false;
    pages.config.registerOnSaveHandler(() => {
      handlerCalled = true;
    });

    utils.sendMessage('settings.save');

    expect(handlerCalled).toBe(true);
  });

  it('should successfully register a remove handler', async () => {
    expect.assertions(2);
    await utils.initializeWithContext(FrameContexts.settings);

    let handlerCalled = false;
    pages.config.registerOnSaveHandler(saveEvent => {
      handlerCalled = true;
      expect(saveEvent.result['webhookUrl']).not.toBeNull();
    });

    utils.sendMessage('settings.save', [
      {
        webhookUrl: 'someWebhookUrl',
      },
    ]);

    expect(handlerCalled).toBe(true);
  });

  it('should successfully override a save handler with another', async () => {
    await utils.initializeWithContext(FrameContexts.settings);

    let handler1Called = false;
    let handler2Called = false;
    pages.config.registerOnSaveHandler(() => {
      handler1Called = true;
    });
    pages.config.registerOnSaveHandler(() => {
      handler2Called = true;
    });

    utils.sendMessage('settings.save');

    expect(handler1Called).toBe(false);
    expect(handler2Called).toBe(true);
  });

  it('should successfully notify success from the registered save handler', async () => {
    await utils.initializeWithContext(FrameContexts.settings);

    let handlerCalled = false;
    pages.config.registerOnSaveHandler(saveEvent => {
      saveEvent.notifySuccess();
      handlerCalled = true;
    });

    utils.sendMessage('settings.save');

    expect(handlerCalled).toBe(true);
    const message = utils.findMessageByFunc('settings.save.success');
    expect(message).not.toBeNull();
    expect(message.args.length).toBe(0);
  });

  it('should successfully notify failure from the registered save handler', async () => {
    await utils.initializeWithContext(FrameContexts.settings);

    let handlerCalled = false;
    pages.config.registerOnSaveHandler(saveEvent => {
      saveEvent.notifyFailure('someReason');
      handlerCalled = true;
    });

    utils.sendMessage('settings.save');

    expect(handlerCalled).toBe(true);
    const message = utils.findMessageByFunc('settings.save.failure');
    expect(message).not.toBeNull();
    expect(message.args.length).toBe(1);
    expect(message.args[0]).toBe('someReason');
  });

  it('should successfully notify success on remove when there is no registered handler', async () => {
    await utils.initializeWithContext(FrameContexts.remove);

    utils.sendMessage('settings.remove');

    const message = utils.findMessageByFunc('settings.remove.success');
    expect(message).not.toBeNull();
    expect(message.args.length).toBe(0);
  });

  it('should successfully notify success from the registered remove handler', async () => {
    await utils.initializeWithContext(FrameContexts.remove);

    let handlerCalled = false;
    pages.config.registerOnRemoveHandler(removeEvent => {
      removeEvent.notifySuccess();
      handlerCalled = true;
    });

    utils.sendMessage('settings.remove');

    expect(handlerCalled).toBe(true);
    const message = utils.findMessageByFunc('settings.remove.success');
    expect(message).not.toBeNull();
    expect(message.args.length).toBe(0);
  });

  it('should successfully notify failure from the registered remove handler', async () => {
    await utils.initializeWithContext(FrameContexts.remove);

    let handlerCalled = false;
    pages.config.registerOnRemoveHandler(removeEvent => {
      removeEvent.notifyFailure('someReason');
      handlerCalled = true;
    });

    utils.sendMessage('settings.remove');

    expect(handlerCalled).toBe(true);
    const message = utils.findMessageByFunc('settings.remove.failure');
    expect(message).not.toBeNull();
    expect(message.args.length).toBe(1);
    expect(message.args[0]).toBe('someReason');
  });

  it('should not allow multiple notifies from the registered save handler', async () => {
    expect.assertions(5);
    await utils.initializeWithContext(FrameContexts.settings);

    let handlerCalled = false;
    pages.config.registerOnSaveHandler(saveEvent => {
      saveEvent.notifySuccess();
      expect(() => saveEvent.notifySuccess()).toThrowError('The SaveEvent may only notify success or failure once.');
      expect(() => saveEvent.notifyFailure()).toThrowError('The SaveEvent may only notify success or failure once.');
      handlerCalled = true;
    });

    utils.sendMessage('settings.save');

    expect(handlerCalled).toBe(true);
    const message = utils.findMessageByFunc('settings.save.success');
    expect(message).not.toBeNull();
    expect(message.args.length).toBe(0);
  });
});
