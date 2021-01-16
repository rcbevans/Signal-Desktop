// Copyright 2018-2020 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import React from 'react';
import classNames from 'classnames';
import { Blurhash } from 'react-blurhash';

import { Spinner } from '../Spinner';
import { LocalizerType } from '../../types/Util';
import { AttachmentType } from '../../types/Attachment';
import { ipcRenderer } from 'electron';

export interface Props {
  alt: string;
  attachment: AttachmentType;
  url: string;

  height?: number;
  width?: number;
  tabIndex?: number;

  overlayText?: string;

  noBorder?: boolean;
  noBackground?: boolean;
  bottomOverlay?: boolean;
  closeButton?: boolean;
  curveBottomLeft?: boolean;
  curveBottomRight?: boolean;
  curveTopLeft?: boolean;
  curveTopRight?: boolean;

  smallCurveTopLeft?: boolean;

  darkOverlay?: boolean;
  playIconOverlay?: boolean;
  softCorners?: boolean;
  blurHash?: string;

  i18n: LocalizerType;
  onClick?: (attachment: AttachmentType) => void;
  onClickClose?: (attachment: AttachmentType) => void;
  onError?: () => void;
}

interface State {
  animate: boolean
}

export class Image extends React.Component<Props, State> {
  private canvasRef = React.createRef<HTMLCanvasElement>();
  private imageRef = React.createRef<HTMLImageElement>();

  public constructor(props: Props)
  {
    super(props);
    this.state = { animate: true }
  }

  private canClick() {
    const { onClick, attachment, url } = this.props;
    const { pending } = attachment || { pending: true };

    return Boolean(onClick && !pending && url);
  }

  private renderImageToCanvas = () => {
    const canvasElement = this.canvasRef.current;
    const imageElement = this.imageRef.current;
    const canvasContext = canvasElement?.getContext("2d"); 

    if (canvasElement && imageElement && canvasContext)
    {
      window.log.info("renderImageToCanvas");
      canvasContext.drawImage(imageElement, 0, 0, imageElement.width, imageElement.height);
      this.forceUpdate();
    }
  }

  private onMainWindowFocus = () =>
  {
    window.log.info("onMainWindowFocus");
    this.setState({animate: true});
  }

  private onMainWindowBlur = () =>
  {
    window.log.info("onMainWindowBlur");
    this.renderImageToCanvas();
    this.setState({animate: false});
  }

  public componentDidMount = () =>
  {
    ipcRenderer.on('main-window-focus', this.onMainWindowFocus);
    ipcRenderer.on('main-window-blur', this.onMainWindowBlur);
    window.getWindowIsFocused().then((isFocused: boolean) => this.setState({ animate: isFocused }));
  }

  public componentWillUnmount = () =>
  {
    ipcRenderer.removeListener('main-window-focus', this.onMainWindowFocus);
    ipcRenderer.removeListener('main-window-blur', this.onMainWindowBlur);
  }

  public handleClick = (event: React.MouseEvent): void => {
    if (!this.canClick()) {
      event.preventDefault();
      event.stopPropagation();

      return;
    }

    const { onClick, attachment } = this.props;

    if (onClick) {
      event.preventDefault();
      event.stopPropagation();

      onClick(attachment);
    }
  };

  public handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>
  ): void => {
    if (!this.canClick()) {
      event.preventDefault();
      event.stopPropagation();

      return;
    }

    const { onClick, attachment } = this.props;

    if (onClick && (event.key === 'Enter' || event.key === 'Space')) {
      event.preventDefault();
      event.stopPropagation();
      onClick(attachment);
    }
  };

  public render(): JSX.Element {
    const {
      alt,
      attachment,
      blurHash,
      bottomOverlay,
      closeButton,
      curveBottomLeft,
      curveBottomRight,
      curveTopLeft,
      curveTopRight,
      darkOverlay,
      height = 0,
      i18n,
      noBackground,
      noBorder,
      onClickClose,
      onError,
      overlayText,
      playIconOverlay,
      smallCurveTopLeft,
      softCorners,
      tabIndex,
      url,
      width = 0,
    } = this.props;

    const { animate } = this.state;

    const { caption, pending } = attachment || { caption: null, pending: true };
    const canClick = this.canClick();

    const overlayClassName = classNames(
      'module-image__border-overlay',
      noBorder ? null : 'module-image__border-overlay--with-border',
      canClick ? 'module-image__border-overlay--with-click-handler' : null,
      curveTopLeft ? 'module-image--curved-top-left' : null,
      curveTopRight ? 'module-image--curved-top-right' : null,
      curveBottomLeft ? 'module-image--curved-bottom-left' : null,
      curveBottomRight ? 'module-image--curved-bottom-right' : null,
      smallCurveTopLeft ? 'module-image--small-curved-top-left' : null,
      softCorners ? 'module-image--soft-corners' : null,
      darkOverlay ? 'module-image__border-overlay--dark' : null
    );

    const overlay = canClick ? (
      // Not sure what this button does.
      // eslint-disable-next-line jsx-a11y/control-has-associated-label
      <button
        type="button"
        className={overlayClassName}
        onClick={this.handleClick}
        onKeyDown={this.handleKeyDown}
        tabIndex={tabIndex}
      />
    ) : null;

    /* eslint-disable no-nested-ternary */
    return (
      <div
        className={classNames(
          'module-image',
          !noBackground ? 'module-image--with-background' : null,
          curveBottomLeft ? 'module-image--curved-bottom-left' : null,
          curveBottomRight ? 'module-image--curved-bottom-right' : null,
          curveTopLeft ? 'module-image--curved-top-left' : null,
          curveTopRight ? 'module-image--curved-top-right' : null,
          smallCurveTopLeft ? 'module-image--small-curved-top-left' : null,
          softCorners ? 'module-image--soft-corners' : null
        )}
      >
        {pending ? (
          <div
            className="module-image__loading-placeholder"
            style={{
              height: `${height}px`,
              width: `${width}px`,
              lineHeight: `${height}px`,
              textAlign: 'center',
            }}
            title={i18n('loading')}
          >
            <Spinner svgSize="normal" />
          </div>
        ) : url ? (
          <>
            <canvas
              ref={this.canvasRef}
              className={classNames("module-image__canvas", animate ? null : "module-image__canvas--visible")}
              height={height}
              width={width}
            />
            <img
              ref={this.imageRef}
              onError={onError}
              className={classNames("module-image__image", animate ? null : "module-image__image--hidden")}
              alt={alt}
              height={height}
              width={width}
              src={url}
              onLoad={this.renderImageToCanvas}
            />
          </>
        ) : blurHash ? (
          <Blurhash
            hash={blurHash}
            width={width}
            height={height}
            style={{ display: 'block' }}
          />
        ) : null}
        {caption ? (
          <img
            className="module-image__caption-icon"
            src="images/caption-shadow.svg"
            alt={i18n('imageCaptionIconAlt')}
          />
        ) : null}
        {bottomOverlay ? (
          <div
            className={classNames(
              'module-image__bottom-overlay',
              curveBottomLeft ? 'module-image--curved-bottom-left' : null,
              curveBottomRight ? 'module-image--curved-bottom-right' : null
            )}
          />
        ) : null}
        {!pending && playIconOverlay ? (
          <div className="module-image__play-overlay__circle">
            <div className="module-image__play-overlay__icon" />
          </div>
        ) : null}
        {overlayText ? (
          <div
            className="module-image__text-container"
            style={{ lineHeight: `${height}px` }}
          >
            {overlayText}
          </div>
        ) : null}
        {overlay}
        {closeButton ? (
          <button
            type="button"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              e.stopPropagation();

              if (onClickClose) {
                onClickClose(attachment);
              }
            }}
            className="module-image__close-button"
            title={i18n('remove-attachment')}
            aria-label={i18n('remove-attachment')}
          />
        ) : null}
      </div>
    );
    /* eslint-enable no-nested-ternary */
  }
}
