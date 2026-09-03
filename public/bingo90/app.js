const STORAGE_KEY = "bingo90.events.v1";
const DELETED_EVENTS_STORAGE_KEY = "bingo90.deletedEvents.v1";
const USERS_STORAGE_KEY = "bingo90.users.v1";
const ADMIN_PASSWORD_STORAGE_KEY = "bingo90.adminPassword.v1";
const STRIP_DESIGN_STORAGE_KEY = "bingo90.stripDesignDraft.v1";
const SERVER_STATE_ENDPOINT = "/api/bingo90/state";
const MEDIA_DB_NAME = "bingo90.media.v1";
const MEDIA_STORE_NAME = "files";
const CARGAS_LAUNCH_STORAGE_KEY = "bingo90.launchedFromCargas";
const SERIES_SIZE = 6;
const NUMBERS_PER_CARD = 15;

const prizeDefinitions = [
  { id: "cuaterno", label: "Cuaterno", count: 4 },
  { id: "linea", label: "Linea", type: "line" },
  { id: "segunda-linea", label: "Segunda linea", type: "line" },
  { id: "pozo", label: "Pozo acumulado", type: "bingo" },
  { id: "bingo", label: "Bingo", type: "bingo" },
  { id: "extra", label: "Carton Extra", type: "bingo" },
];

const prizeFlow = ["cuaterno", "linea", "segunda-linea", "pozo", "bingo", "extra"];
const announcementDefinitions = [
  { id: "cuaterno", label: "Cuaterno", title: "Premio Cuaterno" },
  { id: "linea", label: "Linea", title: "Premio Linea" },
  { id: "segunda-linea", label: "Segunda linea", title: "Premio Segunda Linea" },
  { id: "pozo", label: "Pozo acumulado", title: "Pozo acumulado" },
  { id: "bingo", label: "Bingo", title: "Premio Bingo" },
  { id: "extra", label: "Carton Extra", title: "Carton Extra" },
  { id: "pozo-vacante", label: "Pozo acumulado vacante", title: "Pozo acumulado vacante" },
  { id: "extra-vacante", label: "Extra vacante", title: "Carton Extra vacante" },
];

const state = {
  eventId: createId(),
  eventCreated: false,
  eventSeed: createId(),
  eventName: "",
  eventDetail: "",
  combinationMode: "new",
  combinationSourceEventId: "",
  designMode: "new",
  designSourceEventId: "",
  cardMode: "series",
  rangeStart: 1,
  rangeEnd: 5,
  configuredSeriesCount: 5,
  salesLoaded: false,
  soldUnits: [],
  salesDraftUnits: [],
  completedGames: [],
  drawn: [],
  cards: [],
  prizeResults: [],
  pausedForWinner: false,
  pendingWinners: [],
  winnerViewIndex: 0,
  reviewingWinner: false,
  gameFinished: false,
  extraStartBallIndex: null,
  isGenerating: false,
  generationProgress: 0,
  isProjecting: false,
  recapShown: false,
  pozoVacancyShown: false,
  extraVacancyShown: false,
  prizeEnabled: {
    cuaterno: true,
    linea: true,
    segundaLinea: true,
    pozo: true,
    bingo: true,
    extra: true,
  },
  prizeAmounts: {
    cuaterno: 0,
    linea: 0,
    segundaLinea: 0,
    bingo: 0,
    extra: 0,
  },
  prizeSettings: {
    pozoLimitBall: 37,
    pozoBaseLimitBall: 37,
    pozoLimitIncrement: 1,
    pozoPrize: 0,
    pozoBasePrize: 0,
    pozoPrizeIncrement: 0,
    extraBasePrize: 0,
    extraPrizeIncrement: 0,
    extraBalls: 5,
  },
  cardDesign: {
    title: "",
    accentColor: "#d1223b",
    backgroundColor: "#ffffff",
    footer: "",
  },
  visualSettings: createDefaultVisualSettings(),
  stripDesign: loadPersistedStripDesign(),
  projectionSettings: createDefaultProjectionSettings(),
  editingNewEvent: false,
  currentUser: null,
  view: "landing",
};

let lastBallImageToken = 0;
let activeLastBallImageUrl = "";

const els = {
  landingScreen: document.querySelector("#landingScreen"),
  adminAccessBtn: document.querySelector("#adminAccessBtn"),
  userAccessBtn: document.querySelector("#userAccessBtn"),
  homeScreen: document.querySelector("#homeScreen"),
  userEventsScreen: document.querySelector("#userEventsScreen"),
  userEventsTitle: document.querySelector("#userEventsTitle"),
  userEventsList: document.querySelector("#userEventsList"),
  userLogoutBtn: document.querySelector("#userLogoutBtn"),
  loadScreen: document.querySelector("#loadScreen"),
  salesScreen: document.querySelector("#salesScreen"),
  loadEventForm: document.querySelector("#loadEventForm"),
  loadBackAdminBtn: document.querySelector("#loadBackAdminBtn"),
  loadEventNameInput: document.querySelector("#loadEventNameInput"),
  loadEventDetailInput: document.querySelector("#loadEventDetailInput"),
  loadCombinationNewInput: document.querySelector("#loadCombinationNewInput"),
  loadCombinationExistingInput: document.querySelector("#loadCombinationExistingInput"),
  loadCombinationSourceInput: document.querySelector("#loadCombinationSourceInput"),
  loadDesignCopyInput: document.querySelector("#loadDesignCopyInput"),
  loadDesignNewInput: document.querySelector("#loadDesignNewInput"),
  loadDesignSourceInput: document.querySelector("#loadDesignSourceInput"),
  loadModeSeriesInput: document.querySelector("#loadModeSeriesInput"),
  loadModeIndividualInput: document.querySelector("#loadModeIndividualInput"),
  loadRangeStartInput: document.querySelector("#loadRangeStartInput"),
  loadRangeEndInput: document.querySelector("#loadRangeEndInput"),
  loadCardsTotalInput: document.querySelector("#loadCardsTotalInput"),
  loadGoConfigBtn: document.querySelector("#loadGoConfigBtn"),
  gameScreen: document.querySelector("#gameScreen"),
  gameArea: document.querySelector("#gameArea"),
  generationNotice: document.querySelector("#generationNotice"),
  generationProgressText: document.querySelector("#generationProgressText"),
  createFirstEventBtn: document.querySelector("#createFirstEventBtn"),
  designHomeBtn: document.querySelector("#designHomeBtn"),
  salesHomeBtn: document.querySelector("#salesHomeBtn"),
  stripDesignerBtn: document.querySelector("#stripDesignerBtn"),
  exportCardsPdfBtn: document.querySelector("#exportCardsPdfBtn"),
  adminPlayBtn: document.querySelector("#adminPlayBtn"),
  homeSaveEventBtn: document.querySelector("#homeSaveEventBtn"),
  homeExportReportBtn: document.querySelector("#homeExportReportBtn"),
  homeResetGameBtn: document.querySelector("#homeResetGameBtn"),
  usersAdminBtn: document.querySelector("#usersAdminBtn"),
  exportBackupBtn: document.querySelector("#exportBackupBtn"),
  importBackupBtn: document.querySelector("#importBackupBtn"),
  importBackupInput: document.querySelector("#importBackupInput"),
  salesBackAdminBtn: document.querySelector("#salesBackAdminBtn"),
  salesManualForm: document.querySelector("#salesManualForm"),
  salesFromInput: document.querySelector("#salesFromInput"),
  salesToInput: document.querySelector("#salesToInput"),
  salesRemoveForm: document.querySelector("#salesRemoveForm"),
  salesRemoveInput: document.querySelector("#salesRemoveInput"),
  salesImportBtn: document.querySelector("#salesImportBtn"),
  salesImportInput: document.querySelector("#salesImportInput"),
  salesExportBtn: document.querySelector("#salesExportBtn"),
  salesClearBtn: document.querySelector("#salesClearBtn"),
  salesContinueBtn: document.querySelector("#salesContinueBtn"),
  salesSummary: document.querySelector("#salesSummary"),
  salesList: document.querySelector("#salesList"),
  salesDuplicateDialog: document.querySelector("#salesDuplicateDialog"),
  salesDuplicateMessage: document.querySelector("#salesDuplicateMessage"),
  salesDuplicateList: document.querySelector("#salesDuplicateList"),
  salesDuplicateCloseBtn: document.querySelector("#salesDuplicateCloseBtn"),
  adminLoginDialog: document.querySelector("#adminLoginDialog"),
  adminLoginForm: document.querySelector("#adminLoginForm"),
  adminPasswordInput: document.querySelector("#adminPasswordInput"),
  adminLoginCancelBtn: document.querySelector("#adminLoginCancelBtn"),
  userLoginDialog: document.querySelector("#userLoginDialog"),
  userLoginForm: document.querySelector("#userLoginForm"),
  userLoginNameInput: document.querySelector("#userLoginNameInput"),
  userLoginPasswordInput: document.querySelector("#userLoginPasswordInput"),
  userLoginCancelBtn: document.querySelector("#userLoginCancelBtn"),
  usersDialog: document.querySelector("#usersDialog"),
  adminPasswordForm: document.querySelector("#adminPasswordForm"),
  newAdminPasswordInput: document.querySelector("#newAdminPasswordInput"),
  userCreateForm: document.querySelector("#userCreateForm"),
  newUserNameInput: document.querySelector("#newUserNameInput"),
  newUserPasswordInput: document.querySelector("#newUserPasswordInput"),
  newUserEventsList: document.querySelector("#newUserEventsList"),
  usersList: document.querySelector("#usersList"),
  usersCloseBtn: document.querySelector("#usersCloseBtn"),
  landingBackBtn: document.querySelector("#landingBackBtn"),
  homeSavedEventsList: document.querySelector("#homeSavedEventsList"),
  eventTitle: document.querySelector("#eventTitle"),
  gameBingoLogo: document.querySelector("#gameBingoLogo"),
  gameIndigoLogo: document.querySelector("#gameIndigoLogo"),
  backHomeBtn: document.querySelector("#backHomeBtn"),
  newEventBtn: document.querySelector("#newEventBtn"),
  saveEventStateBtn: document.querySelector("#saveEventStateBtn"),
  exportReportBtn: document.querySelector("#exportReportBtn"),
  resetGameBtn: document.querySelector("#resetGameBtn"),
  drawBallBtn: document.querySelector("#drawBallBtn"),
  undoBallBtn: document.querySelector("#undoBallBtn"),
  manualBallForm: document.querySelector("#manualBallForm"),
  manualBallInput: document.querySelector("#manualBallInput"),
  lastBall: document.querySelector("#lastBall"),
  lastBallImage: document.querySelector("#lastBallImage"),
  drawCount: document.querySelector("#drawCount"),
  gameStatus: document.querySelector("#gameStatus"),
  numberBoard: document.querySelector("#numberBoard"),
  currentPrizeBox: document.querySelector("#currentPrizeBox"),
  prizeSettingsForm: document.querySelector("#prizeSettingsForm"),
  pozoLimitInput: document.querySelector("#pozoLimitInput"),
  ballsOutCount: document.querySelector("#ballsOutCount"),
  winnerList: document.querySelector("#winnerList"),
  historyList: document.querySelector("#historyList"),
  seriesForm: document.querySelector("#seriesForm"),
  seriesCountInput: document.querySelector("#seriesCountInput"),
  clearCardsBtn: document.querySelector("#clearCardsBtn"),
  manualBallSubmitBtn: document.querySelector("#manualBallForm button"),
  pozoLimitSubmitBtn: document.querySelector("#prizeSettingsForm button"),
  seriesSubmitBtn: document.querySelector("#seriesForm button"),
  cardsGrid: document.querySelector("#cardsGrid"),
  cardCount: document.querySelector("#cardCount"),
  nearFullSummary: document.querySelector("#nearFullSummary"),
  nearFullList: document.querySelector("#nearFullList"),
  nearFullDialog: document.querySelector("#nearFullDialog"),
  nearFullDialogTitle: document.querySelector("#nearFullDialogTitle"),
  nearFullDialogSubtitle: document.querySelector("#nearFullDialogSubtitle"),
  nearFullDialogMissing: document.querySelector("#nearFullDialogMissing"),
  nearFullDialogCloseBtn: document.querySelector("#nearFullDialogCloseBtn"),
  nearFullListDialog: document.querySelector("#nearFullListDialog"),
  nearFullListDialogTitle: document.querySelector("#nearFullListDialogTitle"),
  nearFullListDialogList: document.querySelector("#nearFullListDialogList"),
  nearFullListDialogCloseBtn: document.querySelector("#nearFullListDialogCloseBtn"),
  statsList: document.querySelector("#statsList"),
  savedEventsList: document.querySelector("#savedEventsList"),
  settingsBtn: document.querySelector("#settingsBtn"),
  eventDialog: document.querySelector("#eventDialog"),
  eventForm: document.querySelector("#eventForm"),
  eventNameInput: document.querySelector("#eventNameInput"),
  eventDetailInput: document.querySelector("#eventDetailInput"),
  eventModeSeriesInput: document.querySelector("#eventModeSeriesInput"),
  eventModeIndividualInput: document.querySelector("#eventModeIndividualInput"),
  eventRangeStartInput: document.querySelector("#eventRangeStartInput"),
  eventRangeEndInput: document.querySelector("#eventRangeEndInput"),
  eventCardsTotalInput: document.querySelector("#eventCardsTotalInput"),
  eventAccentColorInput: document.querySelector("#eventAccentColorInput"),
  eventPanelColorInput: document.querySelector("#eventPanelColorInput"),
  eventBallSizeInput: document.querySelector("#eventBallSizeInput"),
  eventButtonRadiusInput: document.querySelector("#eventButtonRadiusInput"),
  eventScreenMarginTopInput: document.querySelector("#eventScreenMarginTopInput"),
  eventScreenMarginBottomInput: document.querySelector("#eventScreenMarginBottomInput"),
  eventScreenMarginLeftInput: document.querySelector("#eventScreenMarginLeftInput"),
  eventScreenMarginRightInput: document.querySelector("#eventScreenMarginRightInput"),
  eventBingoLogoInput: document.querySelector("#eventBingoLogoInput"),
  eventBingoLogoStatus: document.querySelector("#eventBingoLogoStatus"),
  eventBingoLogoSizeInput: document.querySelector("#eventBingoLogoSizeInput"),
  eventIndigoLogoInput: document.querySelector("#eventIndigoLogoInput"),
  eventIndigoLogoStatus: document.querySelector("#eventIndigoLogoStatus"),
  eventIndigoLogoSizeInput: document.querySelector("#eventIndigoLogoSizeInput"),
  eventBallImagesInput: document.querySelector("#eventBallImagesInput"),
  eventBallImagesStatus: document.querySelector("#eventBallImagesStatus"),
  eventBoardPanelWidthInput: document.querySelector("#eventBoardPanelWidthInput"),
  eventBoardFontFamilyInput: document.querySelector("#eventBoardFontFamilyInput"),
  eventBoardFontSizeInput: document.querySelector("#eventBoardFontSizeInput"),
  eventSideTitleSizeInput: document.querySelector("#eventSideTitleSizeInput"),
  eventSideTextSizeInput: document.querySelector("#eventSideTextSizeInput"),
  eventBoardButtonColorInput: document.querySelector("#eventBoardButtonColorInput"),
  eventBoardTextColorInput: document.querySelector("#eventBoardTextColorInput"),
  eventBoardDrawnColorInput: document.querySelector("#eventBoardDrawnColorInput"),
  eventBoardDrawnTextColorInput: document.querySelector("#eventBoardDrawnTextColorInput"),
  eventBoardMarkEffectInput: document.querySelector("#eventBoardMarkEffectInput"),
  eventBoardShadowInput: document.querySelector("#eventBoardShadowInput"),
  eventBoardNumberShadowInput: document.querySelector("#eventBoardNumberShadowInput"),
  eventBoardNeonInput: document.querySelector("#eventBoardNeonInput"),
  eventPozoLimitInput: document.querySelector("#eventPozoLimitInput"),
  eventPozoBaseLimitInput: document.querySelector("#eventPozoBaseLimitInput"),
  eventPozoLimitIncrementInput: document.querySelector("#eventPozoLimitIncrementInput"),
  eventCuaternoPrizeInput: document.querySelector("#eventCuaternoPrizeInput"),
  eventCuaternoEnabledInput: document.querySelector("#eventCuaternoEnabledInput"),
  eventLineaPrizeInput: document.querySelector("#eventLineaPrizeInput"),
  eventLineaEnabledInput: document.querySelector("#eventLineaEnabledInput"),
  eventSegundaLineaPrizeInput: document.querySelector("#eventSegundaLineaPrizeInput"),
  eventSegundaLineaEnabledInput: document.querySelector("#eventSegundaLineaEnabledInput"),
  eventPozoPrizeInput: document.querySelector("#eventPozoPrizeInput"),
  eventPozoBasePrizeInput: document.querySelector("#eventPozoBasePrizeInput"),
  eventPozoEnabledInput: document.querySelector("#eventPozoEnabledInput"),
  eventPozoPrizeIncrementInput: document.querySelector("#eventPozoPrizeIncrementInput"),
  eventBingoPrizeInput: document.querySelector("#eventBingoPrizeInput"),
  eventBingoEnabledInput: document.querySelector("#eventBingoEnabledInput"),
  eventExtraPrizeInput: document.querySelector("#eventExtraPrizeInput"),
  eventExtraBasePrizeInput: document.querySelector("#eventExtraBasePrizeInput"),
  eventExtraEnabledInput: document.querySelector("#eventExtraEnabledInput"),
  eventExtraPrizeIncrementInput: document.querySelector("#eventExtraPrizeIncrementInput"),
  eventExtraBallsInput: document.querySelector("#eventExtraBallsInput"),
  eventCardTitleInput: document.querySelector("#eventCardTitleInput"),
  eventCardAccentInput: document.querySelector("#eventCardAccentInput"),
  eventCardBgInput: document.querySelector("#eventCardBgInput"),
  eventCardFooterInput: document.querySelector("#eventCardFooterInput"),
  eventRecapLeadBallsInput: document.querySelector("#eventRecapLeadBallsInput"),
  eventRecapSecondsInput: document.querySelector("#eventRecapSecondsInput"),
  eventRecapMediaInput: document.querySelector("#eventRecapMediaInput"),
  eventRecapMediaStatus: document.querySelector("#eventRecapMediaStatus"),
  eventWinnerMediaSecondsInput: document.querySelector("#eventWinnerMediaSecondsInput"),
  eventPrizeMediaList: document.querySelector("#eventPrizeMediaList"),
  eventHeaderFontFamilyInput: document.querySelector("#eventHeaderFontFamilyInput"),
  eventHeaderTitleSizeInput: document.querySelector("#eventHeaderTitleSizeInput"),
  eventHeaderTitleColorInput: document.querySelector("#eventHeaderTitleColorInput"),
  eventHeaderPrizeFontFamilyInput: document.querySelector("#eventHeaderPrizeFontFamilyInput"),
  eventHeaderPrizeSizeInput: document.querySelector("#eventHeaderPrizeSizeInput"),
  eventHeaderPrizeColorInput: document.querySelector("#eventHeaderPrizeColorInput"),
  eventPrizeFontFamilyInput: document.querySelector("#eventPrizeFontFamilyInput"),
  eventPrizeNameSizeInput: document.querySelector("#eventPrizeNameSizeInput"),
  eventPrizeNameColorInput: document.querySelector("#eventPrizeNameColorInput"),
  eventPrizeAmountSizeInput: document.querySelector("#eventPrizeAmountSizeInput"),
  eventPrizeAmountColorInput: document.querySelector("#eventPrizeAmountColorInput"),
  eventPanelHeadingColorInput: document.querySelector("#eventPanelHeadingColorInput"),
  eventPanelTextColorInput: document.querySelector("#eventPanelTextColorInput"),
  eventProjectionFontFamilyInput: document.querySelector("#eventProjectionFontFamilyInput"),
  eventProjectionTitleSizeInput: document.querySelector("#eventProjectionTitleSizeInput"),
  eventProjectionTitleColorInput: document.querySelector("#eventProjectionTitleColorInput"),
  eventProjectionDetailColorInput: document.querySelector("#eventProjectionDetailColorInput"),
  eventProjectionPreviewBtn: document.querySelector("#eventProjectionPreviewBtn"),
  saveEventBtn: document.querySelector("#saveEventBtn"),
  cancelEventBtn: document.querySelector("#cancelEventBtn"),
  settingsDialog: document.querySelector("#settingsDialog"),
  accentColorInput: document.querySelector("#accentColorInput"),
  panelColorInput: document.querySelector("#panelColorInput"),
  applyThemeBtn: document.querySelector("#applyThemeBtn"),
  stripDesignerDialog: document.querySelector("#stripDesignerDialog"),
  stripDesignerForm: document.querySelector("#stripDesignerForm"),
  stripDesignerCloseBtn: document.querySelector("#stripDesignerCloseBtn"),
  stripHeaderHeightInput: document.querySelector("#stripHeaderHeightInput"),
  stripSeriesInput: document.querySelector("#stripSeriesInput"),
  stripExportFromInput: document.querySelector("#stripExportFromInput"),
  stripExportToInput: document.querySelector("#stripExportToInput"),
  stripExportLimitInput: document.querySelector("#stripExportLimitInput"),
  stripPaperSizeInput: document.querySelector("#stripPaperSizeInput"),
  stripOrientationInput: document.querySelector("#stripOrientationInput"),
  stripContentModeInput: document.querySelector("#stripContentModeInput"),
  stripItemsPerPageInput: document.querySelector("#stripItemsPerPageInput"),
  stripOrderModeInput: document.querySelector("#stripOrderModeInput"),
  stripColumnsInput: document.querySelector("#stripColumnsInput"),
  stripGapInput: document.querySelector("#stripGapInput"),
  stripRowGapInput: document.querySelector("#stripRowGapInput"),
  stripOffsetXInput: document.querySelector("#stripOffsetXInput"),
  stripOffsetYInput: document.querySelector("#stripOffsetYInput"),
  stripFontSizeInput: document.querySelector("#stripFontSizeInput"),
  stripFontFamilyInput: document.querySelector("#stripFontFamilyInput"),
  stripSeriesLabelInput: document.querySelector("#stripSeriesLabelInput"),
  stripSeriesFontSizeInput: document.querySelector("#stripSeriesFontSizeInput"),
  stripSeriesOffsetXInput: document.querySelector("#stripSeriesOffsetXInput"),
  stripSeriesOffsetYInput: document.querySelector("#stripSeriesOffsetYInput"),
  stripSeriesFontFamilyInput: document.querySelector("#stripSeriesFontFamilyInput"),
  stripSeriesColorInput: document.querySelector("#stripSeriesColorInput"),
  stripNumberColorInput: document.querySelector("#stripNumberColorInput"),
  stripCardScaleInput: document.querySelector("#stripCardScaleInput"),
  stripCellSizeInput: document.querySelector("#stripCellSizeInput"),
  stripCellShapeInput: document.querySelector("#stripCellShapeInput"),
  stripCellBorderColorInput: document.querySelector("#stripCellBorderColorInput"),
  stripCellBgEnabledInput: document.querySelector("#stripCellBgEnabledInput"),
  stripCellBgColorInput: document.querySelector("#stripCellBgColorInput"),
  stripAccentInput: document.querySelector("#stripAccentInput"),
  stripBgInput: document.querySelector("#stripBgInput"),
  stripBgImageInput: document.querySelector("#stripBgImageInput"),
  stripBgImageStatus: document.querySelector("#stripBgImageStatus"),
  stripSaveDesignBtn: document.querySelector("#stripSaveDesignBtn"),
  stripExportPdfBtn: document.querySelector("#stripExportPdfBtn"),
  stripExportZipBtn: document.querySelector("#stripExportZipBtn"),
  stripPreviewShell: document.querySelector("#stripPreviewShell"),
  stripPreview: document.querySelector("#stripPreview"),
  winnerDialog: document.querySelector("#winnerDialog"),
  winnerCardTitle: document.querySelector("#winnerCardTitle"),
  winnerCardSubtitle: document.querySelector("#winnerCardSubtitle"),
  winnerPrizeTitle: document.querySelector("#winnerPrizeTitle"),
  winnerCardPreview: document.querySelector("#winnerCardPreview"),
  winnerCountText: document.querySelector("#winnerCountText"),
  winnerPositionText: document.querySelector("#winnerPositionText"),
  winnerPrevBtn: document.querySelector("#winnerPrevBtn"),
  winnerNextBtn: document.querySelector("#winnerNextBtn"),
  winnerContinueBtn: document.querySelector("#winnerContinueBtn"),
  winnerCloseBtn: document.querySelector("#winnerCloseBtn"),
  prizeReviewDialog: document.querySelector("#prizeReviewDialog"),
  prizeReviewTitle: document.querySelector("#prizeReviewTitle"),
  prizeReviewSubtitle: document.querySelector("#prizeReviewSubtitle"),
  prizeReviewList: document.querySelector("#prizeReviewList"),
  prizeReviewCloseBtn: document.querySelector("#prizeReviewCloseBtn"),
  projectionDialog: document.querySelector("#projectionDialog"),
  projectionImage: document.querySelector("#projectionImage"),
  projectionVideo: document.querySelector("#projectionVideo"),
  projectionDefault: document.querySelector("#projectionDefault"),
  projectionTitle: document.querySelector("#projectionTitle"),
  projectionCountdown: document.querySelector("#projectionCountdown"),
};

function init() {
  window.bingoState = state;
  renderBoard();
  renderAnnouncementMediaControls();
  bindEvents();
  rememberCargasLaunch();
  if (isLaunchedFromCargas()) {
    els.backHomeBtn.textContent = "Volver a pagina principal";
    els.landingBackBtn.textContent = "Volver a pagina principal";
    els.userLogoutBtn.textContent = "Volver a pagina principal";
  }
  restoreServerState().finally(async () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "virtual-strip") {
      openVirtualStripPrint(params);
      return;
    }
    const eventId = params.get("eventId");
    const mode = params.get("mode");
    if (eventId && isLaunchedFromCargas() && await loadCargasEvent(eventId, { stayHome: mode === "config" })) {
      if (mode === "config") {
        window.setTimeout(openEventConfiguration, 250);
      }
    } else if (eventId && loadSavedEvents().some((event) => event.id === eventId)) {
      loadEvent(eventId, { stayHome: mode === "config" });
      if (mode === "config") {
        window.setTimeout(openEventConfiguration, 250);
      }
    }
    render();
  });
}

function bindEvents() {
  window.addEventListener("resize", updateStripPreviewScale);
  els.adminAccessBtn.addEventListener("click", openAdminLogin);
  els.userAccessBtn.addEventListener("click", openUserLogin);
  els.adminLoginForm.addEventListener("submit", handleAdminLogin);
  els.adminLoginCancelBtn.addEventListener("click", () => els.adminLoginDialog.close());
  els.userLoginForm.addEventListener("submit", handleUserLogin);
  els.userLoginCancelBtn.addEventListener("click", () => els.userLoginDialog.close());
  els.userLogoutBtn.addEventListener("click", () => {
    if (isLaunchedFromCargas()) returnToCargasHome();
    else showLanding();
  });
  els.drawBallBtn.addEventListener("click", drawRandomBall);
  els.undoBallBtn.addEventListener("click", undoLastBall);
  els.resetGameBtn.addEventListener("click", resetGame);
  els.saveEventStateBtn.addEventListener("click", () => saveCurrentEvent({ manual: true }));
  els.exportReportBtn.addEventListener("click", exportEventReport);
  els.createFirstEventBtn.addEventListener("click", openLoadScreen);
  els.designHomeBtn.addEventListener("click", openEventConfiguration);
  els.salesHomeBtn.addEventListener("click", openSalesScreen);
  els.stripDesignerBtn.addEventListener("click", openStripDesigner);
  els.exportCardsPdfBtn.addEventListener("click", () => exportEventCardsPdf({ useDesignerRange: false }));
  els.adminPlayBtn.addEventListener("click", openAdminGame);
  els.homeSaveEventBtn.addEventListener("click", () => saveCurrentEvent({ manual: true }));
  els.homeExportReportBtn.addEventListener("click", exportEventReport);
  els.homeResetGameBtn.addEventListener("click", resetGame);
  els.usersAdminBtn.addEventListener("click", openUsersAdmin);
  els.adminPasswordForm.addEventListener("submit", changeAdminPassword);
  els.userCreateForm.addEventListener("submit", saveUserFromForm);
  els.usersCloseBtn.addEventListener("click", () => els.usersDialog.close());
  els.exportBackupBtn.addEventListener("click", exportBackupFile);
  els.importBackupBtn.addEventListener("click", () => els.importBackupInput.click());
  els.importBackupInput.addEventListener("change", importBackupFile);
  els.landingBackBtn.addEventListener("click", () => {
    if (isLaunchedFromCargas()) returnToCargasHome();
    else showLanding();
  });
  els.loadBackAdminBtn.addEventListener("click", showHome);
  els.salesBackAdminBtn.addEventListener("click", showHome);
  els.salesManualForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addManualSalesRange();
  });
  els.salesFromInput.addEventListener("keydown", handleSalesFromKeydown);
  els.salesToInput.addEventListener("keydown", handleSalesToKeydown);
  els.salesRemoveForm.addEventListener("submit", (event) => {
    event.preventDefault();
    removeSingleSale();
  });
  els.salesImportBtn.addEventListener("click", () => els.salesImportInput.click());
  els.salesImportInput.addEventListener("change", importSalesFile);
  els.salesExportBtn.addEventListener("click", exportSalesFile);
  els.salesClearBtn.addEventListener("click", clearSales);
  els.salesContinueBtn.addEventListener("click", activateSales);
  els.salesDuplicateCloseBtn.addEventListener("click", () => els.salesDuplicateDialog.close());
  els.loadEventForm.addEventListener("submit", (event) => {
    event.preventDefault();
    applyLoadScreen({ openConfig: true });
  });
  els.loadGoConfigBtn.addEventListener("click", () => applyLoadScreen({ openConfig: true }));
  els.loadRangeStartInput.addEventListener("input", updateLoadEstimatedCards);
  els.loadRangeEndInput.addEventListener("input", updateLoadEstimatedCards);
  els.loadModeSeriesInput.addEventListener("change", updateLoadEstimatedCards);
  els.loadModeIndividualInput.addEventListener("change", updateLoadEstimatedCards);
  els.loadCombinationNewInput.addEventListener("change", updateLoadCreationChoices);
  els.loadCombinationExistingInput.addEventListener("change", updateLoadCreationChoices);
  els.loadCombinationSourceInput.addEventListener("change", applySelectedCombinationPreview);
  els.loadDesignCopyInput.addEventListener("change", updateLoadCreationChoices);
  els.loadDesignNewInput.addEventListener("change", updateLoadCreationChoices);
  els.backHomeBtn.addEventListener("click", () => {
    if (isLaunchedFromCargas()) {
      returnToCargasHome();
      return;
    }
    if (state.currentUser) {
      state.view = "user-events";
      render();
      return;
    }
    showHome();
  });
  els.clearCardsBtn.addEventListener("click", () => {
    state.cards = [];
    state.salesLoaded = false;
    state.soldUnits = [];
    state.salesDraftUnits = [];
    state.prizeResults = [];
    saveCurrentEvent();
    render();
  });
  els.seriesForm.addEventListener("submit", (event) => {
    event.preventDefault();
    generateSeries(Number(els.seriesCountInput.value));
  });
  els.prizeSettingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.prizeSettings.pozoLimitBall = clamp(Number(els.pozoLimitInput.value) || 30, 30, 90);
    rebuildPrizeResults();
    saveCurrentEvent({ silent: true });
    render();
  });
  els.manualBallForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addManualBall(Number(els.manualBallInput.value));
  });
  els.newEventBtn.addEventListener("click", () => {
    state.editingNewEvent = false;
    fillEventDialog({ blank: !state.eventCreated });
    els.eventDialog.showModal();
  });
  els.eventForm.addEventListener("submit", (event) => {
    event.preventDefault();
    applyEventSettings();
  });
  els.cancelEventBtn.addEventListener("click", () => els.eventDialog.close());
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => activateEventTab(button.dataset.tab));
  });
  els.eventRangeStartInput.addEventListener("input", updateEstimatedCards);
  els.eventRangeEndInput.addEventListener("input", updateEstimatedCards);
  els.eventModeSeriesInput.addEventListener("change", updateEstimatedCards);
  els.eventModeIndividualInput.addEventListener("change", updateEstimatedCards);
  els.eventBingoLogoInput.addEventListener("change", () => handleEventLogoSelection("bingo"));
  els.eventIndigoLogoInput.addEventListener("change", () => handleEventLogoSelection("indigo"));
  els.eventBallImagesInput.addEventListener("change", handleBallImagesFolderSelection);
  [
    els.eventAccentColorInput,
    els.eventPanelColorInput,
    els.eventBallSizeInput,
    els.eventButtonRadiusInput,
    els.eventBingoLogoSizeInput,
    els.eventIndigoLogoSizeInput,
    els.eventBoardPanelWidthInput,
    els.eventBoardFontFamilyInput,
    els.eventBoardFontSizeInput,
    els.eventSideTitleSizeInput,
    els.eventSideTextSizeInput,
    els.eventBoardButtonColorInput,
    els.eventBoardTextColorInput,
    els.eventBoardDrawnColorInput,
    els.eventBoardDrawnTextColorInput,
    els.eventBoardMarkEffectInput,
    els.eventBoardShadowInput,
    els.eventBoardNumberShadowInput,
    els.eventBoardNeonInput,
    els.eventScreenMarginTopInput,
    els.eventScreenMarginBottomInput,
    els.eventScreenMarginLeftInput,
    els.eventScreenMarginRightInput,
  ].forEach((input) => {
    input.addEventListener("input", previewBoardVisualSettings);
    input.addEventListener("change", previewBoardVisualSettings);
  });
  getMoneyInputs().forEach((input) => {
    input.addEventListener("focus", () => {
      input.value = parseMoneyInput(input.value) || "";
    });
    input.addEventListener("blur", () => {
      setMoneyInput(input, parseMoneyInput(input.value));
    });
  });
  getTypographyInputs().forEach((input) => {
    input.addEventListener("input", previewTypographySettings);
    input.addEventListener("change", previewTypographySettings);
  });
  els.eventProjectionPreviewBtn.addEventListener("click", previewProjectionCard);
  els.eventRecapMediaInput.addEventListener("change", () => handleMediaSelection("recap", els.eventRecapMediaInput));
  els.eventPrizeMediaList.addEventListener("change", (event) => {
    if (event.target.matches("[data-announcement-media]")) {
      handleMediaSelection(`announcement:${event.target.dataset.announcementMedia}`, event.target);
    }
  });
  els.settingsBtn?.addEventListener("click", () => els.settingsDialog.showModal());
  els.applyThemeBtn.addEventListener("click", () => {
    document.documentElement.style.setProperty("--accent", els.accentColorInput.value);
    document.documentElement.style.setProperty("--panel", els.panelColorInput.value);
  });
  els.stripDesignerCloseBtn.addEventListener("click", () => els.stripDesignerDialog.close());
  els.stripDesignerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    applyStripDesign();
  });
  els.stripBgImageInput.addEventListener("change", handleStripBackgroundSelection);
  els.stripSaveDesignBtn.addEventListener("click", saveStripDesignManually);
  els.stripExportPdfBtn.addEventListener("click", exportStripPdf);
  els.stripExportZipBtn.addEventListener("click", exportStripHtmlZip);
  [
    els.stripHeaderHeightInput,
    els.stripSeriesInput,
    els.stripPaperSizeInput,
    els.stripOrientationInput,
    els.stripContentModeInput,
    els.stripItemsPerPageInput,
    els.stripOrderModeInput,
    els.stripExportLimitInput,
    els.stripColumnsInput,
    els.stripGapInput,
    els.stripRowGapInput,
    els.stripOffsetXInput,
    els.stripOffsetYInput,
    els.stripFontSizeInput,
    els.stripFontFamilyInput,
    els.stripSeriesLabelInput,
    els.stripSeriesFontSizeInput,
    els.stripSeriesOffsetXInput,
    els.stripSeriesOffsetYInput,
    els.stripSeriesFontFamilyInput,
    els.stripSeriesColorInput,
    els.stripNumberColorInput,
    els.stripCardScaleInput,
    els.stripCellSizeInput,
    els.stripCellShapeInput,
    els.stripCellBorderColorInput,
    els.stripCellBgEnabledInput,
    els.stripCellBgColorInput,
    els.stripAccentInput,
    els.stripBgInput,
  ].forEach((input) => {
    input.addEventListener("input", () => applyStripDesign());
    input.addEventListener("change", () => applyStripDesign());
  });
  els.winnerContinueBtn.addEventListener("click", continueAfterWinner);
  els.winnerCloseBtn.addEventListener("click", continueAfterWinner);
  els.winnerPrevBtn.addEventListener("click", () => changeWinnerView(-1));
  els.winnerNextBtn.addEventListener("click", () => changeWinnerView(1));
  els.prizeReviewCloseBtn.addEventListener("click", () => els.prizeReviewDialog.close());
  els.nearFullDialogCloseBtn.addEventListener("click", () => els.nearFullDialog.close());
  els.nearFullListDialogCloseBtn.addEventListener("click", () => els.nearFullListDialog.close());
}

function isLaunchedFromCargas() {
  return new URLSearchParams(window.location.search).get("from") === "cargas" || sessionStorage.getItem(CARGAS_LAUNCH_STORAGE_KEY) === "1";
}

function rememberCargasLaunch() {
  if (new URLSearchParams(window.location.search).get("from") === "cargas") {
    sessionStorage.setItem(CARGAS_LAUNCH_STORAGE_KEY, "1");
  }
}

function returnToCargasHome() {
  window.location.href = "/?page=home";
}

function renderBoard() {
  els.numberBoard.innerHTML = "";
  for (let number = 1; number <= 90; number += 1) {
    const cell = document.createElement("button");
    cell.className = "number-cell";
    cell.type = "button";
    cell.textContent = number;
    cell.dataset.number = String(number);
    cell.addEventListener("click", () => addManualBall(number));
    els.numberBoard.appendChild(cell);
  }
}

function render() {
  const drawnSet = new Set(state.drawn);
  const latest = state.drawn.at(-1);
  const currentPrize = getCurrentPrize();
  const userMode = !!state.currentUser;
  applyVisualSettings();
  document.body.classList.toggle("user-mode", userMode);
  els.landingScreen.classList.toggle("hidden", state.view !== "landing");
  els.homeScreen.classList.toggle("hidden", state.view !== "home");
  els.userEventsScreen.classList.toggle("hidden", state.view !== "user-events");
  els.loadScreen.classList.toggle("hidden", state.view !== "load");
  els.salesScreen.classList.toggle("hidden", state.view !== "sales");
  els.gameScreen.classList.toggle("hidden", state.view !== "game");
  els.eventTitle.textContent = state.eventCreated ? state.eventName : "Sin evento activo";
  const salesReady = state.salesLoaded && state.soldUnits.length > 0;
  const playLocked = !state.eventCreated || !salesReady || state.gameFinished || state.isProjecting;
  els.gameArea.classList.toggle("is-disabled", !state.eventCreated || !salesReady || state.isProjecting);
  els.gameArea.classList.toggle("game-finished-lock", state.gameFinished);
  els.generationNotice.classList.toggle("hidden", !state.isGenerating || state.generationProgress >= 100 || state.view === "game");
  els.generationProgressText.textContent = `${state.generationProgress}% - ${state.cards.length} de ${getGenerationCardTotal()} cartones`;
  els.lastBall.textContent = latest || "--";
  renderLastBallImage(latest);
  els.drawCount.textContent = `${state.drawn.length} bolillas cantadas`;
  els.ballsOutCount.textContent = state.drawn.length;
  els.gameStatus.innerHTML = currentPrize
    ? `<span>Jugando:</span><strong>${escapeHtml(currentPrize.label)}</strong>`
    : `<strong>Partida completa</strong>`;
  els.pozoLimitInput.value = state.prizeSettings.pozoLimitBall;
  els.seriesCountInput.value = state.configuredSeriesCount;
  els.undoBallBtn.disabled = state.drawn.length === 0 || playLocked;
  els.drawBallBtn.disabled = playLocked || state.pausedForWinner || state.drawn.length === 90;
  els.manualBallInput.disabled = playLocked || state.pausedForWinner;
  els.manualBallSubmitBtn.disabled = playLocked || state.pausedForWinner;
  els.pozoLimitInput.disabled = state.gameFinished || state.isProjecting;
  els.pozoLimitSubmitBtn.disabled = state.gameFinished || state.isProjecting;
  els.seriesCountInput.disabled = state.gameFinished || state.isProjecting;
  els.seriesSubmitBtn.disabled = state.gameFinished || state.isProjecting;
  els.clearCardsBtn.disabled = state.gameFinished || state.isProjecting;
  els.backHomeBtn.disabled = state.isProjecting;
  els.newEventBtn.disabled = state.gameFinished || state.isProjecting;
  els.saveEventStateBtn.disabled = userMode || !state.eventCreated;
  els.exportReportBtn.disabled = userMode || !state.eventCreated || state.gameFinished;
  els.resetGameBtn.disabled = userMode || !state.eventCreated || state.gameFinished;
  updateHomeActionAvailability();

  document.querySelectorAll(".number-cell").forEach((cell) => {
    const number = Number(cell.dataset.number);
    cell.classList.toggle("drawn", drawnSet.has(number));
    cell.classList.toggle("latest", number === latest);
  });

  renderHistory();
  renderWinners();
  renderCurrentPrize(currentPrize);
  renderNearFullCards();
  renderStats();
  renderSalesScreen();
  renderUserEvents();
  renderSavedEvents();
  renderHomeSavedEvents();
}

function updateHomeActionAvailability() {
  const needsSelectedEvent = [
    els.designHomeBtn,
    els.salesHomeBtn,
    els.stripDesignerBtn,
    els.exportCardsPdfBtn,
    els.adminPlayBtn,
    els.homeSaveEventBtn,
    els.homeResetGameBtn,
  ];
  needsSelectedEvent.forEach((button) => {
    if (button) button.disabled = !state.eventCreated;
  });
  if (els.homeExportReportBtn) {
    els.homeExportReportBtn.disabled = !state.eventCreated || !state.gameFinished;
  }
}

async function renderLastBallImage(number) {
  const token = ++lastBallImageToken;
  const image = els.lastBallImage;
  if (!image) return;
  const key = number ? state.visualSettings.ballImageKeys?.[number] : "";
  if (!key) {
    renderFallbackBallImage(number);
    return;
  }
  try {
    const file = await loadMediaFile(key);
    if (token !== lastBallImageToken) return;
    if (!file) {
      renderFallbackBallImage(number);
      return;
    }
    if (activeLastBallImageUrl) URL.revokeObjectURL(activeLastBallImageUrl);
    activeLastBallImageUrl = URL.createObjectURL(file);
    image.src = activeLastBallImageUrl;
    image.parentElement.classList.add("has-ball-image");
    image.classList.remove("ball-enter");
    void image.offsetWidth;
    image.classList.add("ball-enter");
  } catch {
    if (token === lastBallImageToken) renderFallbackBallImage(number);
  }
}

function renderFallbackBallImage(number) {
  if (!number || !els.lastBallImage) {
    clearLastBallImage();
    return;
  }
  if (activeLastBallImageUrl) URL.revokeObjectURL(activeLastBallImageUrl);
  activeLastBallImageUrl = "";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">
      <defs>
        <radialGradient id="shine" cx="32%" cy="24%" r="70%">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="0.42" stop-color="#f1f4f8"/>
          <stop offset="1" stop-color="#b9c0c9"/>
        </radialGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#000000" flood-opacity="0.4"/>
        </filter>
      </defs>
      <circle cx="160" cy="160" r="132" fill="url(#shine)" filter="url(#shadow)"/>
      <circle cx="160" cy="160" r="118" fill="none" stroke="#c41220" stroke-width="12"/>
      <path d="M70 98c48 24 103 21 180-12M46 178c72-18 140-9 230 42M112 52c-10 66 8 148 76 232M238 74c-66 70-86 132-74 205" fill="none" stroke="#c41220" stroke-width="8" opacity="0.82"/>
      <text x="160" y="188" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="106" font-weight="900" fill="#c41220">${number}</text>
    </svg>`;
  els.lastBallImage.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  els.lastBallImage.parentElement.classList.add("has-ball-image");
  els.lastBallImage.classList.remove("ball-enter");
  void els.lastBallImage.offsetWidth;
  els.lastBallImage.classList.add("ball-enter");
}

function clearLastBallImage() {
  if (activeLastBallImageUrl) URL.revokeObjectURL(activeLastBallImageUrl);
  activeLastBallImageUrl = "";
  if (!els.lastBallImage) return;
  els.lastBallImage.removeAttribute("src");
  els.lastBallImage.parentElement.classList.remove("has-ball-image");
}

function renderCards(drawnSet) {
  if (!els.cardsGrid || !els.cardCount) return;
  els.cardsGrid.innerHTML = "";
  const seriesCount = getGeneratedSeriesCount();
  const totalCards = getConfiguredCardTotal();
  const modeLabel = state.cardMode === "series" ? `${seriesCount} series cargadas` : "cartones individuales";
  els.cardCount.textContent = `${state.cards.length} cartones cargados - ${totalCards} configurados - ${modeLabel}`;
  if (!state.cards.length) {
    els.cardsGrid.innerHTML = `<div class="winner-item">Todavia no hay cartones generados.</div>`;
    return;
  }
  const visibleCards = state.cards.slice(0, 240);
  visibleCards.forEach((card) => {
    const article = document.createElement("article");
    article.className = "bingo-card";
    article.style.setProperty("--card-accent", state.cardDesign.accentColor);
    article.style.setProperty("--card-bg", state.cardDesign.backgroundColor);
    article.innerHTML = `
      <header>
        <strong>${state.cardDesign.title || state.eventName || "Bingo 90"}</strong>
        <span>${getCardLabel(card)}</span>
      </header>
      <div class="card-series">${getCardGroupLabel(card)}</div>
    `;
    const grid = document.createElement("div");
    grid.className = "card-grid";
    card.rows.forEach((row) => {
      const rowEl = document.createElement("div");
      rowEl.className = "card-row";
      row.forEach((number) => {
        const cell = document.createElement("span");
        cell.className = number ? "card-number" : "card-empty";
        if (number) {
          cell.textContent = number;
          cell.classList.toggle("marked", drawnSet.has(number));
        }
        rowEl.appendChild(cell);
      });
      grid.appendChild(rowEl);
    });
    article.appendChild(grid);
    if (state.cardDesign.footer) {
      const footer = document.createElement("footer");
      footer.textContent = state.cardDesign.footer;
      article.appendChild(footer);
    }
    els.cardsGrid.appendChild(article);
  });
  if (state.cards.length > visibleCards.length) {
    const note = document.createElement("div");
    note.className = "winner-item";
    note.innerHTML = `<strong>Muestra de cartones</strong><br><span>Se muestran ${visibleCards.length} de ${state.cards.length} para mantener agil la pantalla.</span>`;
    els.cardsGrid.appendChild(note);
  }
}

function renderNearFullCards() {
  if (!els.nearFullSummary || !els.nearFullList) return;
  const items = getNearFullCards();
  const counts = {
    3: items.filter((item) => item.missingCount === 3).length,
    2: items.filter((item) => item.missingCount === 2).length,
    1: items.filter((item) => item.missingCount === 1).length,
  };
  els.nearFullSummary.innerHTML = `
    <button type="button" class="near-full-summary-card" data-missing-count="3" title="Doble clic para ver cartones">
      <strong>${counts[3]}</strong><span>Faltan 3</span>
    </button>
    <button type="button" class="near-full-summary-card" data-missing-count="2" title="Doble clic para ver cartones">
      <strong>${counts[2]}</strong><span>Faltan 2</span>
    </button>
    <button type="button" class="near-full-summary-card" data-missing-count="1" title="Doble clic para ver cartones">
      <strong>${counts[1]}</strong><span>Falta 1</span>
    </button>
  `;
  els.nearFullSummary.querySelectorAll(".near-full-summary-card").forEach((button) => {
    const missingCount = Number(button.dataset.missingCount);
    button.addEventListener("dblclick", () => openNearFullList(missingCount));
    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter") openNearFullList(missingCount);
    });
  });
  els.nearFullList.innerHTML = "";
  if (!items.length) {
    return;
  }
  items.forEach((item) => {
    const button = document.createElement("button");
    button.className = `near-full-card-button missing-${item.missingCount}`;
    button.type = "button";
    button.textContent = `Carton ${item.card.cardNumber}`;
    button.addEventListener("click", () => openNearFullDetail(item));
    els.nearFullList.appendChild(button);
  });
}

function getNearFullCards() {
  if (!state.salesLoaded || !state.soldUnits.length || !state.drawn.length) return [];
  const drawnSet = new Set(state.drawn);
  const completedWinnerIds = new Set(
    state.prizeResults
      .filter((winner) => ["pozo", "bingo", "extra"].includes(winner.prizeId))
      .map((winner) => winner.cardId),
  );
  return getPlayableCards()
    .filter((card) => !completedWinnerIds.has(card.id))
    .map((card) => {
      const numbers = card.rows.flat().filter(Boolean);
      const missingNumbers = numbers.filter((number) => !drawnSet.has(number)).sort((a, b) => a - b);
      return {
        card,
        missingNumbers,
        missingCount: missingNumbers.length,
      };
    })
    .filter((item) => item.missingCount >= 1 && item.missingCount <= 3)
    .sort((a, b) => a.missingCount - b.missingCount || Number(a.card.cardNumber) - Number(b.card.cardNumber));
}

function openNearFullDetail(item) {
  const card = item.card;
  const missingLabel = item.missingCount === 1
    ? "Le falta 1 numero"
    : `Le faltan ${item.missingCount} numeros`;
  els.nearFullDialogTitle.textContent = `Carton ${card.cardNumber}`;
  els.nearFullDialogSubtitle.textContent = card.mode === "individual"
    ? "Carton individual"
    : `Serie ${card.series}`;
  els.nearFullDialogMissing.innerHTML = `
    <span>${missingLabel}</span>
    ${buildNearFullCardPreview(item)}
    <div class="near-full-missing-numbers">
      <span>Faltan</span>
      ${item.missingNumbers.map((number) => `<strong>${number}</strong>`).join("")}
    </div>
  `;
  if (!els.nearFullDialog.open) els.nearFullDialog.showModal();
}

function buildNearFullCardPreview(item) {
  const drawnSet = new Set(state.drawn);
  const rows = item.card.rows.map((row) => `
    <div class="near-full-card-row">
      ${row.map((number) => buildNearFullCardCell(number, drawnSet)).join("")}
    </div>
  `).join("");
  const seriesLabel = item.card.mode === "individual" ? "Carton individual" : `Serie ${item.card.series}`;
  return `
    <article class="near-full-card-preview">
      <header>
        <strong>Carton N° ${item.card.cardNumber}</strong>
        <span>${seriesLabel}</span>
      </header>
      <div class="near-full-card-grid">${rows}</div>
      <footer>
        <span class="near-full-marked-sample">Marcado</span>
        <span class="near-full-pending-sample">Sin marcar: bolillas faltantes</span>
      </footer>
    </article>
  `;
}

function buildNearFullCardCell(number, drawnSet) {
  if (!number) return `<span class="near-full-card-empty"></span>`;
  const markedClass = drawnSet.has(number) ? " marked" : " pending";
  return `<span class="near-full-card-number${markedClass}">${number}</span>`;
}

function openNearFullList(missingCount) {
  const items = getNearFullCards().filter((item) => item.missingCount === missingCount);
  const label = missingCount === 1 ? "Falta 1 bolilla" : `Faltan ${missingCount} bolillas`;
  els.nearFullListDialogTitle.textContent = `${label} - ${items.length} cartones`;
  if (!items.length) {
    els.nearFullListDialogList.innerHTML = `<div class="near-full-empty">No hay cartones en este grupo.</div>`;
  } else {
    els.nearFullListDialogList.innerHTML = "";
    items.forEach((item) => {
      const button = document.createElement("button");
      button.className = `near-full-card-button missing-${item.missingCount}`;
      button.type = "button";
      button.innerHTML = `
        <strong>Carton ${item.card.cardNumber}</strong>
        <span>${item.card.mode === "individual" ? "Carton individual" : `Serie ${item.card.series}`}</span>
      `;
      button.addEventListener("click", () => {
        els.nearFullListDialog.close();
        openNearFullDetail(item);
      });
      els.nearFullListDialogList.appendChild(button);
    });
  }
  if (!els.nearFullListDialog.open) els.nearFullListDialog.showModal();
}

function renderHistory() {
  els.historyList.innerHTML = "";
  [...state.drawn].reverse().forEach((number, index) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.textContent = `${state.drawn.length - index}. Bolilla ${number}`;
    els.historyList.appendChild(item);
  });
  if (!state.drawn.length) {
    els.historyList.innerHTML = `<div class="history-item">Sin bolillas cantadas</div>`;
  }
}

function getCardLabel(card) {
  if (card.mode === "individual") return `Carton ${card.cardNumber}`;
  return `Carton ${card.cardNumber}`;
}

function getCardGroupLabel(card) {
  if (card.mode === "individual") return "Individual";
  return `Serie ${card.series}`;
}

function renderWinners() {
  const winners = state.prizeResults;
  els.winnerList.innerHTML = "";
  if (!winners.length) {
    els.winnerList.innerHTML = `<div class="winner-item">Sin ganadores por ahora</div>`;
    return;
  }
  winners.forEach((winner) => {
    const item = document.createElement("div");
    item.className = "winner-item";
    const seriesLine = winner.mode === "individual" ? "Carton individual" : `N° de serie: ${winner.series}`;
    const rowLine = winner.rowNumber ? `<span>N° de fila: ${winner.rowNumber}</span>` : "";
    item.innerHTML = `
      <strong>${winner.prize}</strong>
      <span>${seriesLine}</span>
      <span>N° de carton: ${winner.cardNumber}</span>
      ${rowLine}
      <span>Bolilla ultima del premio: ${winner.ball} (${winner.ballIndex}° cantada)</span>
    `;
    els.winnerList.appendChild(item);
  });
}

function renderWinners() {
  const winners = state.prizeResults;
  els.winnerList.innerHTML = "";
  if (!winners.length) {
    els.winnerList.innerHTML = `<div class="winner-item">Sin ganadores por ahora</div>`;
    return;
  }
  groupWinnersByPrize(winners).forEach(({ prizeId, prize, winners: prizeWinners }) => {
    const item = document.createElement("div");
    item.className = "winner-item";
    const firstWinner = prizeWinners[0];
    const seriesLine = firstWinner.mode === "individual" ? "Carton individual" : `N° de serie: ${firstWinner.series}`;
    const rowLine = firstWinner.rowNumber ? `<span>N° de fila: ${firstWinner.rowNumber}</span>` : "";
    item.innerHTML = `
      <strong>${prize}</strong>
      <span>${prizeWinners.length} carton${prizeWinners.length === 1 ? "" : "es"} ganador${prizeWinners.length === 1 ? "" : "es"}</span>
      <span>${seriesLine}</span>
      <span>N° de carton: ${firstWinner.cardNumber}</span>
      ${rowLine}
      <span>Bolilla ultima del premio: ${firstWinner.ball} (${firstWinner.ballIndex}° cantada)</span>
    `;
    const button = document.createElement("button");
    button.className = "ghost-button";
    button.type = "button";
    button.textContent = "Ver cartones";
    button.addEventListener("click", () => openPrizeReview(prizeId));
    item.appendChild(button);
    els.winnerList.appendChild(item);
  });
}

function groupWinnersByPrize(winners) {
  const groups = new Map();
  winners.forEach((winner) => {
    if (!groups.has(winner.prizeId)) groups.set(winner.prizeId, { prizeId: winner.prizeId, prize: winner.prize, winners: [] });
    groups.get(winner.prizeId).winners.push(winner);
  });
  return [...groups.values()];
}

function openPrizeReview(prizeId) {
  const winners = state.prizeResults.filter((winner) => winner.prizeId === prizeId);
  if (!winners.length) return;
  els.prizeReviewTitle.textContent = winners[0].prize;
  els.prizeReviewSubtitle.textContent = `${winners.length} carton${winners.length === 1 ? "" : "es"} ganador${winners.length === 1 ? "" : "es"}`;
  els.prizeReviewList.innerHTML = "";
  winners.forEach((winner, index) => {
    const item = document.createElement("button");
    item.className = "prize-review-item";
    item.type = "button";
    const seriesLine = winner.mode === "individual" ? "Carton individual" : `Serie N° ${winner.series}`;
    const rowLine = winner.rowNumber ? `<span>Fila N° ${winner.rowNumber}</span>` : "";
    item.innerHTML = `
      <strong>${index + 1}. Carton N° ${winner.cardNumber}</strong>
      <span>${seriesLine}</span>
      ${rowLine}
      <span>Bolilla ultima: ${winner.ball} (${winner.ballIndex}° cantada)</span>
    `;
    item.addEventListener("click", () => replayWinnerCard(winner));
    els.prizeReviewList.appendChild(item);
  });
  if (!els.prizeReviewDialog.open) els.prizeReviewDialog.showModal();
}

function replayWinnerCard(winner) {
  state.pendingWinners = [winner];
  state.winnerViewIndex = 0;
  state.reviewingWinner = true;
  renderWinnerDialogCurrent();
  if (els.prizeReviewDialog.open) els.prizeReviewDialog.close();
  if (!els.winnerDialog.open) els.winnerDialog.showModal();
}

function renderWinners() {
  const winners = state.prizeResults;
  els.winnerList.innerHTML = "";
  if (!winners.length) {
    els.winnerList.innerHTML = `<div class="winner-item">Sin ganadores por ahora</div>`;
    return;
  }
  groupWinnersByPrize(winners).forEach(({ prizeId, prize, winners: prizeWinners }) => {
    const item = document.createElement("div");
    item.className = "winner-item compact-winner-item";
    item.innerHTML = `
      <strong>${prize}</strong>
      <span>${prizeWinners.length} carton${prizeWinners.length === 1 ? "" : "es"} ganador${prizeWinners.length === 1 ? "" : "es"}</span>
    `;
    const button = document.createElement("button");
    button.className = "ghost-button";
    button.type = "button";
    button.textContent = "Ver cartones";
    button.addEventListener("click", () => openPrizeReview(prizeId));
    item.appendChild(button);
    els.winnerList.appendChild(item);
  });
}

function openPrizeReview(prizeId) {
  const winners = state.prizeResults.filter((winner) => winner.prizeId === prizeId);
  if (!winners.length) return;
  els.prizeReviewTitle.textContent = winners[0].prize;
  els.prizeReviewSubtitle.textContent = `${winners.length} carton${winners.length === 1 ? "" : "es"} ganador${winners.length === 1 ? "" : "es"}`;
  els.prizeReviewList.innerHTML = "";
  winners.forEach((winner, index) => {
    const item = document.createElement("button");
    item.className = "prize-review-item";
    item.type = "button";
    const seriesLine = winner.mode === "individual" ? "Carton individual" : `Serie N° ${winner.series}`;
    const rowLine = winner.rowNumber ? `<span>Fila N° ${winner.rowNumber}</span>` : "";
    item.innerHTML = `
      <strong>${index + 1}. Carton N° ${winner.cardNumber}</strong>
      <span>${seriesLine}</span>
      ${rowLine}
      <span>Bolilla ultima: ${winner.ball} (${winner.ballIndex}° cantada)</span>
    `;
    item.addEventListener("click", () => replayWinnerCard(winner));
    els.prizeReviewList.appendChild(item);
  });
  if (!els.prizeReviewDialog.open) els.prizeReviewDialog.showModal();
}

function renderCurrentPrize(currentPrize) {
  if (!state.eventCreated) {
    els.currentPrizeBox.innerHTML = `
      <div class="winner-item">
        <strong>Sin evento</strong><br>
        <span>Crea un evento para habilitar los premios.</span>
      </div>
    `;
    return;
  }
  if (!state.salesLoaded || !state.soldUnits.length) {
    els.currentPrizeBox.innerHTML = `
      <div class="winner-item">
        <strong>Ventas pendientes</strong><br>
        <span>Carga ventas antes de iniciar la partida.</span>
      </div>
    `;
    return;
  }
  if (!currentPrize) {
    els.currentPrizeBox.innerHTML = `
      <div class="winner-item">
        <strong>Partida completa</strong><br>
        <span>No quedan premios pendientes.</span>
      </div>
    `;
    return;
  }
  const detail = currentPrize.id === "pozo"
    ? `Carton lleno hasta bolilla ${state.prizeSettings.pozoLimitBall}`
    : getPrizeDetail(currentPrize.id);
  const prizeAmount = getPrizeAmount(currentPrize.id);
  els.currentPrizeBox.innerHTML = `
    <div class="winner-item current-prize-item">
      <strong class="prize-name">${currentPrize.label}</strong>
      <span class="prize-detail">${detail}</span>
      ${prizeAmount > 0 ? `<span class="prize-amount">${formatMoney(prizeAmount)}</span>` : ""}
    </div>
  `;
}

function getPrizeAmount(prizeId) {
  const amounts = {
    cuaterno: state.prizeAmounts.cuaterno,
    linea: state.prizeAmounts.linea,
    "segunda-linea": state.prizeAmounts.segundaLinea,
    pozo: state.prizeSettings.pozoPrize,
    bingo: state.prizeAmounts.bingo,
    extra: state.prizeAmounts.extra,
  };
  return Math.max(0, Number(amounts[prizeId]) || 0);
}

function getPrizeDetail(prizeId) {
  const details = {
    cuaterno: "4 de 5 numeros en cualquiera de las 3 filas",
    linea: "5 de 5 numeros en cualquiera de las 3 filas",
    "segunda-linea": "Otra fila completa en el carton",
    bingo: "Carton lleno sin bolilla tope",
    extra: "Otro carton lleno despues del bingo",
  };
  return details[prizeId] || "";
}

function renderStats() {
  const saved = loadSavedEvents().find((event) => event.id === state.eventId);
  const seriesCount = getGeneratedSeriesCount();
  const soldCards = getSoldCardCount();
  els.statsList.innerHTML = `
    <div class="stat-item"><strong>${seriesCount}</strong><span>Series</span></div>
    <div class="stat-item"><strong>${state.cards.length}</strong><span>Cartones cargados</span></div>
    <div class="stat-item"><strong>${soldCards}</strong><span>Vendidos</span></div>
    <div class="stat-item"><strong>${state.drawn.length}</strong><span>Bolillas</span></div>
    <div class="stat-item"><strong>${state.prizeResults.length}</strong><span>Ganadores</span></div>
    <div class="stat-item"><strong>${state.prizeSettings.pozoLimitBall}</strong><span>Tope pozo</span></div>
    <div class="stat-item"><strong>${saved ? "Si" : "No"}</strong><span>Guardado</span></div>
  `;
}

function renderSalesScreen() {
  if (!els.salesSummary || !els.salesList) return;
  const unitLabel = getSalesUnitLabel();
  const draftUnits = getSalesDraftUnits();
  const draftCards = getDraftCardCount();
  const soldCards = getSoldCardCount();
  const totalUnits = getConfiguredUnitCount();
  const totalCards = getConfiguredCardTotal();
  els.salesSummary.innerHTML = `
    <div class="sales-summary-item"><strong>${draftUnits.length}</strong><span>${unitLabel.plural} cargadas</span></div>
    <div class="sales-summary-item"><strong>${draftCards}</strong><span>Cartones a activar</span></div>
    <div class="sales-summary-item"><strong>${soldCards}</strong><span>Cartones activos</span></div>
    <div class="sales-summary-item"><strong>${totalUnits}</strong><span>${unitLabel.plural} generadas</span></div>
    <div class="sales-summary-item"><strong>${totalCards}</strong><span>Cartones generados</span></div>
  `;
  els.salesFromInput.min = 1;
  els.salesFromInput.max = 20000;
  els.salesToInput.min = 1;
  els.salesToInput.max = 20000;
  if (!draftUnits.length) {
    els.salesList.innerHTML = `<div class="sales-list-item"><strong>Sin ventas cargadas</strong><br><span>Agrega un rango manual o importa un archivo TXT/DAT.</span></div>`;
    return;
  }
  const ranges = compressNumberRanges(draftUnits);
  els.salesList.innerHTML = "";
  ranges.forEach((item) => {
    const rangeItem = document.createElement("div");
    rangeItem.className = "sales-list-item selectable-sales-range";
    rangeItem.tabIndex = 0;
    rangeItem.dataset.range = item.label;
    const amount = item.end - item.start + 1;
    rangeItem.innerHTML = `
      <div class="sales-list-row">
        <strong>${item.label}</strong>
        <span>(${amount})</span>
      </div>
    `;
    rangeItem.addEventListener("click", () => selectSalesRangeForRemoval(item.label, rangeItem));
    rangeItem.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectSalesRangeForRemoval(item.label, rangeItem);
      }
    });
    els.salesList.appendChild(rangeItem);
  });
}

function selectSalesRangeForRemoval(rangeLabel, rangeItem) {
  els.salesRemoveInput.value = rangeLabel;
  els.salesList.querySelectorAll(".selectable-sales-range").forEach((item) => {
    item.classList.toggle("selected", item === rangeItem);
  });
  els.salesRemoveInput.focus();
  els.salesRemoveInput.select();
}

function renderSavedEvents() {
  if (!els.savedEventsList) return;
  const events = loadSavedEvents();
  els.savedEventsList.innerHTML = "";
  if (!events.length) {
    els.savedEventsList.innerHTML = `<div class="history-item">Todavia no hay eventos guardados</div>`;
    return;
  }
  events.forEach((event) => {
    const item = document.createElement("div");
    item.className = "saved-event-item";
    item.innerHTML = `
      <strong>${event.name}</strong>
      <span>${event.stats.series} series - ${event.stats.cards} cartones - ${event.stats.soldCards || 0} vendidos - Tope ${event.prizeSettings?.pozoLimitBall || 30}</span>
      <div class="saved-event-actions">
        <button class="ghost-button" type="button" data-action="open">Abrir</button>
        <button class="danger-button" type="button" data-action="delete">Eliminar</button>
      </div>
    `;
    item.querySelector('[data-action="open"]').addEventListener("click", () => loadEvent(event.id));
    item.querySelector('[data-action="delete"]').addEventListener("click", () => deleteEvent(event.id));
    els.savedEventsList.appendChild(item);
  });
}

function renderHomeSavedEvents() {
  const events = loadSavedEvents();
  els.homeSavedEventsList.innerHTML = "";
  if (!events.length) {
    els.homeSavedEventsList.innerHTML = `<div class="history-item">Todavia no hay eventos creados.</div>`;
    return;
  }
  events.forEach((event) => {
    const item = document.createElement("div");
    item.className = `saved-event-item home-event-item selectable-event${state.eventId === event.id && state.eventCreated ? " selected" : ""}`;
    item.innerHTML = `
      <div class="event-info">
        <strong>${event.name}</strong>
        <span>${event.eventDetail || "Sin detalle"}</span>
        <span>${event.stats.cards} cartones - ${event.stats.soldCards || 0} vendidos - ${event.stats.drawn} bolillas cantadas - ${event.stats.winners} premios detectados</span>
      </div>
      <button class="event-select-button" type="button" data-action="select" aria-label="Seleccionar evento ${escapeHtml(event.name)}">
        <span>${state.eventId === event.id && state.eventCreated ? "✓" : ""}</span>
      </button>
      <div class="saved-event-actions">
        <button class="primary-button" type="button" data-action="open">Abrir evento</button>
        <button class="danger-button" type="button" data-action="delete">Eliminar</button>
      </div>
    `;
    item.querySelector('[data-action="select"]').addEventListener("click", () => selectHomeEvent(event.id));
    item.querySelector('[data-action="open"]').addEventListener("click", () => loadEvent(event.id));
    item.querySelector('[data-action="delete"]').addEventListener("click", () => deleteEvent(event.id));
    els.homeSavedEventsList.appendChild(item);
  });
}

function selectHomeEvent(eventId) {
  if (state.eventCreated && state.eventId === eventId) {
    resetActiveEventToHome();
    state.view = "home";
    render();
    return;
  }
  loadEvent(eventId, { stayHome: true });
}

function renderUserEvents() {
  if (!els.userEventsList) return;
  const user = state.currentUser;
  els.userEventsTitle.textContent = user ? `Eventos de ${user.name}` : "Eventos habilitados";
  els.userEventsList.innerHTML = "";
  if (!user) {
    els.userEventsList.innerHTML = `<div class="history-item">Ingresa con usuario y contrasena.</div>`;
    return;
  }
  const allowed = new Set(user.allowedEventIds || []);
  const events = loadSavedEvents().filter((event) => allowed.has(event.id));
  if (!events.length) {
    els.userEventsList.innerHTML = `<div class="history-item">No tenes eventos habilitados. Consulta al administrador.</div>`;
    return;
  }
  events.forEach((event) => {
    const locked = !!event.salesLoaded;
    const item = document.createElement("div");
    item.className = "saved-event-item home-event-item";
    item.innerHTML = `
      <strong>${event.name}</strong>
      <span>${event.eventDetail || "Sin detalle"}</span>
      <span>${event.stats.cards} cartones - ${event.stats.soldCards || 0} vendidos - ${locked ? "Carga cerrada" : "Carga editable"}</span>
      <div class="saved-event-actions">
        ${locked ? `<button class="primary-button" type="button" data-user-action="open">Abrir evento</button>` : ""}
        ${locked ? `<button class="ghost-button" type="button" data-user-action="locked">Configurar evento</button>` : `<button class="ghost-button" type="button" data-user-action="config">Configurar evento</button>`}
        ${locked ? `<button class="ghost-button" type="button" data-user-action="locked">Cargar ventas</button>` : `<button class="primary-button" type="button" data-user-action="sales">Cargar ventas</button>`}
      </div>
    `;
    item.querySelector('[data-user-action="open"]')?.addEventListener("click", () => loadEvent(event.id));
    item.querySelectorAll('[data-user-action="locked"]').forEach((button) => {
      button.addEventListener("click", () => window.alert("Este evento ya tiene ventas activadas. El usuario no puede volver a editarlo."));
    });
    item.querySelector('[data-user-action="config"]')?.addEventListener("click", () => {
      loadEvent(event.id);
      setTimeout(openEventConfiguration, 0);
    });
    item.querySelector('[data-user-action="sales"]')?.addEventListener("click", () => {
      loadEvent(event.id);
      setTimeout(openSalesScreen, 0);
    });
    els.userEventsList.appendChild(item);
  });
}

function showHome() {
  state.view = "home";
  render();
}

function openAdminLogin() {
  state.currentUser = null;
  els.userLoginDialog.close();
  els.adminPasswordInput.value = "";
  els.adminLoginDialog.showModal();
  setTimeout(() => els.adminPasswordInput.focus(), 0);
}

function handleAdminLogin(event) {
  event.preventDefault();
  if (els.adminPasswordInput.value !== getAdminPassword()) {
    window.alert("Clave de administrador incorrecta.");
    return;
  }
  state.currentUser = null;
  els.adminLoginDialog.close();
  showHome();
}

function openUserLogin() {
  fillUserLoginSelector();
  els.userLoginPasswordInput.value = "";
  els.userLoginDialog.showModal();
  setTimeout(() => els.userLoginNameInput.focus(), 0);
}

function handleUserLogin(event) {
  event.preventDefault();
  const name = els.userLoginNameInput.value.trim();
  const password = els.userLoginPasswordInput.value;
  const user = loadUsers().find((item) => item.name.toLowerCase() === name.toLowerCase() && item.password === password);
  if (!user) {
    window.alert("Usuario o contrasena incorrectos.");
    return;
  }
  state.currentUser = user;
  els.userLoginDialog.close();
  state.view = "user-events";
  render();
}

function fillUserLoginSelector() {
  const users = loadUsers().sort((a, b) => a.name.localeCompare(b.name, "es"));
  els.userLoginNameInput.innerHTML = users.length
    ? `<option value="">Seleccionar usuario</option>${users.map((user) => `<option value="${escapeHtml(user.name)}">${escapeHtml(user.name)}</option>`).join("")}`
    : `<option value="">No hay usuarios creados</option>`;
  els.userLoginNameInput.disabled = users.length === 0;
  els.userLoginPasswordInput.disabled = users.length === 0;
  if (!users.length) {
    setTimeout(() => window.alert("Todavia no hay usuarios creados. Ingresá como administrador y crealos desde Usuarios."), 0);
  }
}

function openLoadScreen() {
  resetDraftForNewEvent();
  fillLoadSourceSelectors();
  els.loadEventNameInput.value = state.eventName;
  els.loadEventDetailInput.value = state.eventDetail;
  els.loadCombinationNewInput.checked = true;
  els.loadCombinationExistingInput.checked = false;
  els.loadDesignNewInput.checked = true;
  els.loadDesignCopyInput.checked = false;
  els.loadModeSeriesInput.checked = state.cardMode === "series";
  els.loadModeIndividualInput.checked = state.cardMode === "individual";
  els.loadRangeStartInput.value = state.rangeStart;
  els.loadRangeEndInput.value = state.rangeEnd;
  updateLoadCreationChoices();
  updateLoadEstimatedCards();
  state.view = "load";
  render();
}

function fillLoadSourceSelectors() {
  const events = loadSavedEvents();
  const optionsHtml = events.length
    ? events.map((event) => {
      const mode = event.cardMode === "individual" ? "cartones" : "series";
      const from = event.rangeStart || 1;
      const to = event.rangeEnd || Math.max(from, event.configuredSeriesCount || from);
      const cards = event.cardMode === "individual" ? (to - from + 1) : (to - from + 1) * SERIES_SIZE;
      return `<option value="${escapeHtml(event.id)}">${escapeHtml(event.name)} - ${from} a ${to} ${mode} - ${cards} cartones</option>`;
    }).join("")
    : "";
  els.loadCombinationSourceInput.innerHTML = `<option value="">Seleccionar combinacion creada</option>${optionsHtml}`;
  els.loadDesignSourceInput.innerHTML = `<option value="">Seleccionar diseno a copiar</option>${optionsHtml}`;
}

function updateLoadCreationChoices() {
  const events = loadSavedEvents();
  const hasEvents = events.length > 0;
  if (!hasEvents) {
    els.loadCombinationNewInput.checked = true;
    els.loadCombinationExistingInput.checked = false;
    els.loadDesignNewInput.checked = true;
    els.loadDesignCopyInput.checked = false;
  }

  els.loadCombinationExistingInput.disabled = !hasEvents;
  els.loadCombinationSourceInput.disabled = !hasEvents || !els.loadCombinationExistingInput.checked;
  els.loadDesignCopyInput.disabled = !hasEvents;
  els.loadDesignSourceInput.disabled = !hasEvents || !els.loadDesignCopyInput.checked;

  if (hasEvents && els.loadCombinationExistingInput.checked && !els.loadCombinationSourceInput.value) {
    els.loadCombinationSourceInput.value = events[0].id;
  }
  if (hasEvents && els.loadDesignCopyInput.checked && !els.loadDesignSourceInput.value) {
    els.loadDesignSourceInput.value = events[0].id;
  }

  const usingExistingCombination = hasEvents && els.loadCombinationExistingInput.checked;
  els.loadModeSeriesInput.disabled = usingExistingCombination;
  els.loadModeIndividualInput.disabled = usingExistingCombination;
  els.loadRangeStartInput.disabled = usingExistingCombination;
  els.loadRangeEndInput.disabled = usingExistingCombination;

  if (usingExistingCombination) applySelectedCombinationPreview();
  updateLoadEstimatedCards();
}

function applySelectedCombinationPreview() {
  if (!els.loadCombinationExistingInput.checked) return;
  const event = getSavedEventById(els.loadCombinationSourceInput.value);
  if (!event) return;
  els.loadModeSeriesInput.checked = (event.cardMode || "series") === "series";
  els.loadModeIndividualInput.checked = event.cardMode === "individual";
  els.loadRangeStartInput.value = event.rangeStart || 1;
  els.loadRangeEndInput.value = event.rangeEnd || event.configuredSeriesCount || 1;
  updateLoadEstimatedCards();
}

function showLanding() {
  state.currentUser = null;
  state.view = "landing";
  render();
}

function showGame() {
  state.view = "game";
  render();
}

function openUserAccess() {
  if (state.eventCreated) {
    showGame();
    return;
  }
  const savedEvents = loadSavedEvents();
  if (savedEvents.length) {
    loadEvent(savedEvents[0].id);
    return;
  }
  window.alert("Todavia no hay un evento creado para usuarios.");
}

function openEventConfiguration() {
  if (state.currentUser && state.salesLoaded) {
    window.alert("Este evento ya tiene ventas activadas. No se puede volver a configurar con usuario.");
    state.view = "user-events";
    render();
    return;
  }
  fillEventDialog({ blank: !state.eventCreated });
  activateEventTab("premios");
  els.eventDialog.showModal();
}

function openUsersAdmin() {
  renderUsersAdmin();
  els.usersDialog.showModal();
}

function renderUsersAdmin() {
  const events = loadSavedEvents();
  els.newUserEventsList.innerHTML = events.length
    ? events.map((event) => `
      <label class="permission-item">
        <input type="checkbox" value="${event.id}">
        <span>${escapeHtml(event.name)}</span>
      </label>
    `).join("")
    : `<div class="history-item">Todavia no hay eventos para asignar.</div>`;
  const users = loadUsers();
  els.usersList.innerHTML = users.length
    ? users.map((user) => {
      const allowedNames = events
        .filter((event) => (user.allowedEventIds || []).includes(event.id))
        .map((event) => event.name);
      return `
        <div class="saved-event-item">
          <strong>${escapeHtml(user.name)}</strong>
          <span>${allowedNames.length ? allowedNames.map(escapeHtml).join(", ") : "Sin eventos asignados"}</span>
          <div class="saved-event-actions">
            <button class="danger-button" type="button" data-user-delete="${escapeHtml(user.id)}">Eliminar</button>
          </div>
        </div>
      `;
    }).join("")
    : `<div class="history-item">Todavia no hay usuarios creados.</div>`;
  els.usersList.querySelectorAll("[data-user-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteUser(button.dataset.userDelete));
  });
}

function changeAdminPassword(event) {
  event.preventDefault();
  const password = els.newAdminPasswordInput.value.trim();
  if (password.length < 3) {
    window.alert("La clave debe tener al menos 3 caracteres.");
    return;
  }
  localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, password);
  els.newAdminPasswordInput.value = "";
  scheduleServerStateSave();
  window.alert("Clave de administrador actualizada.");
}

function saveUserFromForm(event) {
  event.preventDefault();
  const name = els.newUserNameInput.value.trim();
  const password = els.newUserPasswordInput.value;
  const allowedEventIds = [...els.newUserEventsList.querySelectorAll("input:checked")].map((input) => input.value);
  if (!name || !password) {
    window.alert("Completa usuario y contrasena.");
    return;
  }
  const users = loadUsers();
  const existing = users.find((user) => user.name.toLowerCase() === name.toLowerCase());
  const nextUser = {
    id: existing?.id || createId(),
    name,
    password,
    allowedEventIds,
  };
  const nextUsers = [nextUser, ...users.filter((user) => user.id !== nextUser.id)];
  saveUsers(nextUsers);
  els.newUserNameInput.value = "";
  els.newUserPasswordInput.value = "";
  renderUsersAdmin();
}

function deleteUser(userId) {
  const users = loadUsers();
  const user = users.find((item) => item.id === userId);
  if (!user) return;
  if (!window.confirm(`Eliminar usuario "${user.name}"?`)) return;
  saveUsers(users.filter((item) => item.id !== userId));
  renderUsersAdmin();
}

function openSalesScreen() {
  if (!state.eventCreated) {
    window.alert("Primero carga o abre un evento.");
    openLoadScreen();
    return;
  }
  if (state.currentUser && state.salesLoaded) {
    window.alert("La carga de ventas ya fue activada. No se puede volver a editar.");
    state.view = "user-events";
    render();
    return;
  }
  if (!state.cards.length && !state.isGenerating) {
    generateConfiguredCards({ preserveGame: true });
  }
  state.view = "sales";
  render();
}

function openAdminGame() {
  if (!state.eventCreated) {
    window.alert("Primero carga o abre un evento.");
    openLoadScreen();
    return;
  }
  if (!state.salesLoaded || !state.soldUnits.length) {
    window.alert("Antes de jugar carga las ventas. Solo las series o cartones vendidos participan.");
    openSalesScreen();
    return;
  }
  showGame();
}

function updateLoadEstimatedCards() {
  const range = normalizeRange(
    Number(els.loadRangeStartInput.value) || 1,
    Number(els.loadRangeEndInput.value) || 1,
  );
  const units = range.end - range.start + 1;
  const total = els.loadModeIndividualInput.checked ? units : units * SERIES_SIZE;
  els.loadCardsTotalInput.value = total;
}

function applyLoadScreen(options = {}) {
  const useExistingCombination = els.loadCombinationExistingInput.checked;
  const combinationSource = useExistingCombination ? getSavedEventById(els.loadCombinationSourceInput.value) : null;
  const copyDesign = els.loadDesignCopyInput.checked;
  const designSource = copyDesign ? getSavedEventById(els.loadDesignSourceInput.value) : null;

  if (useExistingCombination && !combinationSource) {
    window.alert("Selecciona un evento origen para usar COMBINACIONES CREADAS.");
    return;
  }
  if (copyDesign && !designSource) {
    window.alert("Selecciona un evento origen para COPIAR DISEÑO.");
    return;
  }

  const nextMode = useExistingCombination
    ? (combinationSource.cardMode || "series")
    : (els.loadModeIndividualInput.checked ? "individual" : "series");
  const nextRange = normalizeRange(
    useExistingCombination ? (combinationSource.rangeStart || 1) : (Number(els.loadRangeStartInput.value) || 1),
    useExistingCombination ? (combinationSource.rangeEnd || combinationSource.configuredSeriesCount || 1) : (Number(els.loadRangeEndInput.value) || 1),
  );
  const nextEventName = els.loadEventNameInput.value.trim() || "Evento principal";
  const nextEventDetail = els.loadEventDetailInput.value.trim();

  resetDraftForNewEvent();
  state.eventId = createId();
  state.eventSeed = useExistingCombination ? (combinationSource.eventSeed || combinationSource.id) : createId();
  state.eventName = els.loadEventNameInput.value.trim() || "Evento principal";
  state.eventDetail = nextEventDetail;
  state.cardMode = nextMode;
  state.rangeStart = nextRange.start;
  state.rangeEnd = nextRange.end;
  state.configuredSeriesCount = getConfiguredUnitCount();
  state.combinationMode = useExistingCombination ? "existing" : "new";
  state.combinationSourceEventId = combinationSource?.id || "";
  state.designMode = copyDesign ? "copy" : "new";
  state.designSourceEventId = designSource?.id || "";
  state.eventName = nextEventName;
  if (copyDesign) applyDesignFromEvent(designSource);
  state.eventCreated = true;
  state.salesLoaded = false;
  state.soldUnits = [];
  state.salesDraftUnits = [];
  state.view = "sales";
  generateConfiguredCards();
  if (options.openConfig) {
    fillEventDialog({ blank: false });
    activateEventTab("premios");
    els.eventDialog.showModal();
  }
}

function openStripDesigner() {
  fillStripDesigner();
  renderStripPreview();
  els.stripDesignerDialog.showModal();
}

function fillStripDesigner() {
  els.stripHeaderHeightInput.value = state.stripDesign.headerHeight;
  const rangeStart = state.rangeStart || 1;
  const rangeEnd = state.rangeEnd || rangeStart;
  els.stripSeriesInput.value = rangeStart;
  els.stripSeriesInput.min = rangeStart;
  els.stripSeriesInput.max = rangeEnd;
  els.stripExportFromInput.value = rangeStart;
  els.stripExportFromInput.min = rangeStart;
  els.stripExportFromInput.max = rangeEnd;
  els.stripExportToInput.value = rangeEnd;
  els.stripExportToInput.min = rangeStart;
  els.stripExportToInput.max = rangeEnd;
  els.stripExportLimitInput.value = state.stripDesign.exportLimit ?? 300;
  els.stripPaperSizeInput.value = state.stripDesign.paperSize;
  els.stripOrientationInput.value = state.stripDesign.orientation;
  els.stripContentModeInput.value = state.stripDesign.contentMode;
  els.stripItemsPerPageInput.value = state.stripDesign.itemsPerPage;
  els.stripOrderModeInput.value = state.stripDesign.orderMode || "consecutive";
  els.stripColumnsInput.value = state.stripDesign.columns;
  els.stripGapInput.value = state.stripDesign.gap;
  els.stripRowGapInput.value = state.stripDesign.rowGap;
  els.stripOffsetXInput.value = state.stripDesign.offsetX;
  els.stripOffsetYInput.value = state.stripDesign.offsetY;
  els.stripFontSizeInput.value = state.stripDesign.fontSize;
  els.stripFontFamilyInput.value = state.stripDesign.fontFamily;
  els.stripSeriesLabelInput.value = state.stripDesign.seriesLabel;
  els.stripSeriesFontSizeInput.value = state.stripDesign.seriesFontSize;
  els.stripSeriesOffsetXInput.value = state.stripDesign.seriesOffsetX ?? 0;
  els.stripSeriesOffsetYInput.value = state.stripDesign.seriesOffsetY ?? 0;
  els.stripSeriesFontFamilyInput.value = state.stripDesign.seriesFontFamily;
  els.stripSeriesColorInput.value = state.stripDesign.seriesColor;
  els.stripNumberColorInput.value = state.stripDesign.numberColor;
  els.stripCardScaleInput.value = state.stripDesign.cardScale;
  els.stripCellSizeInput.value = state.stripDesign.cellSize;
  els.stripCellShapeInput.value = state.stripDesign.cellShape;
  els.stripCellBorderColorInput.value = state.stripDesign.cellBorderColor;
  els.stripCellBgEnabledInput.checked = state.stripDesign.cellBgEnabled;
  els.stripCellBgColorInput.value = state.stripDesign.cellBgColor;
  els.stripAccentInput.value = state.stripDesign.accentColor;
  els.stripBgInput.value = state.stripDesign.backgroundColor;
  els.stripBgImageStatus.textContent = state.stripDesign.backgroundImageName
    ? `Imagen cargada: ${state.stripDesign.backgroundImageName}`
    : "Sin imagen de fondo.";
}

function applyStripDesign(options = {}) {
  state.stripDesign.headerHeight = clamp(Number(els.stripHeaderHeightInput.value) || 0, 0, 180);
  state.stripDesign.paperSize = els.stripPaperSizeInput.value;
  state.stripDesign.orientation = els.stripOrientationInput.value;
  state.stripDesign.contentMode = els.stripContentModeInput.value;
  state.stripDesign.itemsPerPage = clamp(Number(els.stripItemsPerPageInput.value) || 1, 1, 24);
  state.stripDesign.orderMode = els.stripOrderModeInput.value || "consecutive";
  state.stripDesign.exportLimit = clamp(Number(els.stripExportLimitInput.value) || 0, 0, 20000);
  state.stripDesign.columns = clamp(Number(els.stripColumnsInput.value) || 1, 1, 6);
  state.stripDesign.gap = clamp(Number(els.stripGapInput.value) || 0, 0, 1000);
  state.stripDesign.rowGap = clamp(Number(els.stripRowGapInput.value) || 0, 0, 1000);
  state.stripDesign.offsetX = clamp(Number(els.stripOffsetXInput.value) || 0, -120, 120);
  state.stripDesign.offsetY = clamp(Number(els.stripOffsetYInput.value) || 0, -120, 120);
  state.stripDesign.fontSize = clamp(Number(els.stripFontSizeInput.value) || 16, 10, 200);
  state.stripDesign.fontFamily = els.stripFontFamilyInput.value;
  state.stripDesign.seriesLabel = els.stripSeriesLabelInput.value.trim() || "Serie N°";
  state.stripDesign.seriesFontSize = clamp(Number(els.stripSeriesFontSizeInput.value) || 13, 8, 200);
  state.stripDesign.seriesOffsetX = clamp(Number(els.stripSeriesOffsetXInput.value) || 0, -300, 300);
  state.stripDesign.seriesOffsetY = clamp(Number(els.stripSeriesOffsetYInput.value) || 0, -120, 120);
  state.stripDesign.seriesFontFamily = els.stripSeriesFontFamilyInput.value;
  state.stripDesign.seriesColor = els.stripSeriesColorInput.value;
  state.stripDesign.numberColor = els.stripNumberColorInput.value;
  state.stripDesign.cardScale = clamp(Number(els.stripCardScaleInput.value) || 100, 60, 160);
  state.stripDesign.cellSize = clamp(Number(els.stripCellSizeInput.value) || 18, 12, 42);
  state.stripDesign.cellShape = els.stripCellShapeInput.value;
  state.stripDesign.cellBorderColor = els.stripCellBorderColorInput.value;
  state.stripDesign.cellBgEnabled = els.stripCellBgEnabledInput.checked;
  state.stripDesign.cellBgColor = els.stripCellBgColorInput.value;
  state.stripDesign.accentColor = els.stripAccentInput.value;
  state.stripDesign.backgroundColor = els.stripBgInput.value;
  renderStripPreview();
  if (!options.skipPersist) persistEventDesign();
}

async function saveStripDesignManually() {
  const button = els.stripSaveDesignBtn;
  const previousText = button?.textContent;
  if (button) {
    button.disabled = true;
    button.textContent = "Guardando...";
  }
  let serverSaved = false;
  let saveError = null;
  try {
    applyStripDesign({ skipPersist: true });
    const savedEvent = persistEventDesign({ skipCargasSave: true });
    serverSaved = savedEvent ? await saveCargasBingoPanelSettings(savedEvent, { throwOnError: true, timeoutMs: 60000 }) : true;
  } catch (error) {
    saveError = error;
    serverSaved = false;
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = previousText;
    }
  }
  if (!serverSaved) {
    window.alert(`El diseno quedo en esta pantalla, pero no se pudo confirmar el guardado en Cargas.\n\n${describeCargasPanelSaveError(saveError)}\n\nVolve a entrar desde Cargas, revisa la sesion y toca Guardar diseno otra vez.`);
    return;
  }
  window.alert("Diseno guardado en Cargas. La proxima vez este evento se abre con esta configuracion.");
}

function handleStripBackgroundSelection() {
  const file = els.stripBgImageInput.files[0];
  if (!file) return;
  if (!["image/jpeg", "image/png"].includes(file.type)) {
    window.alert("Selecciona una imagen JPG, JPEG o PNG.");
    els.stripBgImageInput.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    state.stripDesign.backgroundImageData = String(reader.result || "");
    state.stripDesign.backgroundImageName = file.name;
    els.stripBgImageStatus.textContent = `Imagen cargada: ${file.name}`;
    renderStripPreview();
    persistEventDesign();
  };
  reader.readAsDataURL(file);
}

function handleEventLogoSelection(kind) {
  const input = kind === "indigo" ? els.eventIndigoLogoInput : els.eventBingoLogoInput;
  const status = kind === "indigo" ? els.eventIndigoLogoStatus : els.eventBingoLogoStatus;
  const file = input.files[0];
  if (!file) return;
  if (!["image/jpeg", "image/png"].includes(file.type)) {
    window.alert("Selecciona una imagen JPG, JPEG o PNG.");
    input.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const dataKey = kind === "indigo" ? "indigoLogoData" : "bingoLogoData";
    const nameKey = kind === "indigo" ? "indigoLogoName" : "bingoLogoName";
    state.visualSettings[dataKey] = String(reader.result || "");
    state.visualSettings[nameKey] = file.name;
    status.textContent = `Logo cargado: ${file.name}`;
    applyVisualSettings();
    persistEventDesign();
  };
  reader.readAsDataURL(file);
}

function previewBoardVisualSettings() {
  readGeneralVisualSettingsFromForm();
  readScreenLayoutSettingsFromForm();
  readBoardVisualSettingsFromForm();
  applyVisualSettings();
  if (state.eventCreated) saveCurrentEvent({ silent: true });
}

function previewTypographySettings() {
  readTypographySettingsFromForm();
  applyVisualSettings();
  if (state.eventCreated) saveCurrentEvent({ silent: true });
}

function previewProjectionCard() {
  readTypographySettingsFromForm();
  applyVisualSettings();
  showProjection({
    title: "Vista previa de proyeccion",
    seconds: 4,
    mediaKey: "",
    useDefault: true,
  });
}

function readBoardVisualSettingsFromForm() {
  state.visualSettings.bingoLogoSize = clamp(Number(els.eventBingoLogoSizeInput.value) || 158, 60, 360);
  state.visualSettings.indigoLogoSize = clamp(Number(els.eventIndigoLogoSizeInput.value) || 118, 60, 320);
  state.visualSettings.boardPanelWidth = clamp(Number(els.eventBoardPanelWidthInput.value) || 150, 100, 220);
  state.visualSettings.boardFontFamily = els.eventBoardFontFamilyInput.value;
  state.visualSettings.boardFontSize = clamp(Number(els.eventBoardFontSizeInput.value) || 22, 12, 260);
  state.visualSettings.sideTitleSize = clamp(Number(els.eventSideTitleSizeInput.value) || 19, 12, 120);
  state.visualSettings.sideTextSize = clamp(Number(els.eventSideTextSizeInput.value) || 16, 12, 120);
  state.visualSettings.boardButtonColor = els.eventBoardButtonColorInput.value;
  state.visualSettings.boardTextColor = els.eventBoardTextColorInput.value;
  state.visualSettings.boardDrawnColor = els.eventBoardDrawnColorInput.value;
  state.visualSettings.boardDrawnTextColor = els.eventBoardDrawnTextColorInput.value;
  state.visualSettings.boardMarkEffect = els.eventBoardMarkEffectInput.value;
  state.visualSettings.boardShadow = els.eventBoardShadowInput.checked;
  state.visualSettings.boardNumberShadow = els.eventBoardNumberShadowInput.checked;
  state.visualSettings.boardNeon = els.eventBoardNeonInput.checked;
}

function readGeneralVisualSettingsFromForm() {
  state.visualSettings.accentColor = els.eventAccentColorInput.value;
  state.visualSettings.panelColor = els.eventPanelColorInput.value;
  state.visualSettings.ballSize = clamp(Number(els.eventBallSizeInput.value) || 74, 36, 96);
  state.visualSettings.buttonRadius = clamp(Number(els.eventButtonRadiusInput.value) || 8, 0, 24);
}

function readScreenLayoutSettingsFromForm() {
  state.visualSettings.screenMarginTop = clamp(Number(els.eventScreenMarginTopInput.value) || 0, 0, 120);
  state.visualSettings.screenMarginBottom = clamp(Number(els.eventScreenMarginBottomInput.value) || 0, 0, 120);
  state.visualSettings.screenMarginLeft = clamp(Number(els.eventScreenMarginLeftInput.value) || 0, 0, 160);
  state.visualSettings.screenMarginRight = clamp(Number(els.eventScreenMarginRightInput.value) || 0, 0, 160);
}

function readTypographySettingsFromForm() {
  state.visualSettings.headerFontFamily = els.eventHeaderFontFamilyInput.value;
  state.visualSettings.headerTitleSize = clamp(Number(els.eventHeaderTitleSizeInput.value) || 26, 18, 200);
  state.visualSettings.headerTitleColor = els.eventHeaderTitleColorInput.value;
  state.visualSettings.headerPrizeFontFamily = els.eventHeaderPrizeFontFamilyInput.value;
  state.visualSettings.headerPrizeSize = clamp(Number(els.eventHeaderPrizeSizeInput.value) || 16, 12, 200);
  state.visualSettings.headerPrizeColor = els.eventHeaderPrizeColorInput.value;
  state.visualSettings.prizeFontFamily = els.eventPrizeFontFamilyInput.value;
  state.visualSettings.prizeNameSize = clamp(Number(els.eventPrizeNameSizeInput.value) || 16, 12, 200);
  state.visualSettings.prizeNameColor = els.eventPrizeNameColorInput.value;
  state.visualSettings.prizeAmountSize = clamp(Number(els.eventPrizeAmountSizeInput.value) || 18, 12, 200);
  state.visualSettings.prizeAmountColor = els.eventPrizeAmountColorInput.value;
  state.visualSettings.panelHeadingColor = els.eventPanelHeadingColorInput.value;
  state.visualSettings.panelTextColor = els.eventPanelTextColorInput.value;
  state.visualSettings.projectionFontFamily = els.eventProjectionFontFamilyInput.value;
  state.visualSettings.projectionTitleSize = clamp(Number(els.eventProjectionTitleSizeInput.value) || 80, 36, 200);
  state.visualSettings.projectionTitleColor = els.eventProjectionTitleColorInput.value;
  state.visualSettings.projectionDetailColor = els.eventProjectionDetailColorInput.value;
}

async function handleBallImagesFolderSelection() {
  const files = [...(els.eventBallImagesInput.files || [])];
  if (!files.length) return;
  const images = files
    .map((file) => ({ file, number: getBallNumberFromFileName(file.name) }))
    .filter((item) => item.number && ["image/jpeg", "image/png"].includes(item.file.type));
  if (!images.length) {
    window.alert("No encontre imagenes JPG/PNG con numeros del 1 al 90 en el nombre del archivo.");
    els.eventBallImagesInput.value = "";
    return;
  }
  const nextMap = { ...(state.visualSettings.ballImageKeys || {}) };
  let savedCount = 0;
  for (const item of images) {
    const key = `${state.eventId}-ball-${item.number}-${createId()}`;
    try {
      await storeMediaFile(key, item.file);
      nextMap[item.number] = key;
      savedCount += 1;
    } catch {
      // Continua con las demas imagenes si una falla.
    }
  }
  state.visualSettings.ballImageKeys = nextMap;
  state.visualSettings.ballImageSetName = files[0]?.webkitRelativePath?.split("/")[0] || "Bolillas personalizadas";
  els.eventBallImagesStatus.textContent = getBallImagesStatusText();
  els.eventBallImagesInput.value = "";
  if (state.eventCreated) saveCurrentEvent({ silent: true });
  renderLastBallImage(state.drawn.at(-1));
  window.alert(`Se cargaron ${savedCount} imagenes de bolillas. Usa nombres como 1.png, bolilla-9.jpg o numero_90.png.`);
}

function getBallNumberFromFileName(fileName) {
  const matches = String(fileName || "").match(/\d{1,2}/g) || [];
  const numbers = matches.map(Number).filter((number) => number >= 1 && number <= 90);
  return numbers[0] || null;
}

function getBallImagesStatusText() {
  const count = Object.keys(state.visualSettings.ballImageKeys || {}).length;
  if (!count) return "Sin bolillas personalizadas.";
  return `${count} bolillas cargadas${state.visualSettings.ballImageSetName ? ` (${state.visualSettings.ballImageSetName})` : ""}.`;
}

function persistEventDesign(options = {}) {
  persistStripDesignDraft();
  if (!state.eventCreated) return null;
  return saveCurrentEvent({ silent: true, skipCargasSave: options.skipCargasSave });
}

function persistStripDesignDraft() {
  try {
    localStorage.setItem(STRIP_DESIGN_STORAGE_KEY, JSON.stringify(state.stripDesign));
  } catch {
    // Si el fondo es muy pesado, el evento igual sigue en memoria durante la sesion.
  }
  scheduleServerStateSave();
}

async function restoreServerState() {
  if (!canUseServerState()) return;
  try {
    const response = await fetch(SERVER_STATE_ENDPOINT, { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    applyBackupPayload(payload, { onlyIfNewer: true });
  } catch {
    // Si se abre como archivo o el servidor no esta disponible, queda el guardado del navegador.
  }
}

let serverStateSaveTimer = null;

function scheduleServerStateSave() {
  if (!canUseServerState()) return;
  window.clearTimeout(serverStateSaveTimer);
  serverStateSaveTimer = window.setTimeout(saveServerState, 350);
}

async function saveServerState() {
  if (!canUseServerState()) return;
  try {
    const response = await fetch(SERVER_STATE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildBackupPayload()),
    });
    if (!response.ok) throw new Error("El servidor no pudo guardar el respaldo.");
    return true;
  } catch {
    // El respaldo manual sigue disponible aunque el servidor no este activo.
    return false;
  }
}

function canUseServerState() {
  return location.protocol === "http:" || location.protocol === "https:";
}

function buildBackupPayload() {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    events: loadSavedEvents(),
    deletedEventIds: loadDeletedEventIds(),
    users: loadUsers(),
    adminPassword: getAdminPassword(),
    stripDesign: state.stripDesign,
  };
}

function applyBackupPayload(payload, options = {}) {
  if (!payload || typeof payload !== "object") return false;
  const incomingEvents = Array.isArray(payload.events) ? payload.events : [];
  const incomingDeletedIds = Array.isArray(payload.deletedEventIds) ? payload.deletedEventIds : [];
  if (incomingDeletedIds.length) {
    saveDeletedEventIds([...loadDeletedEventIds(), ...incomingDeletedIds]);
  }
  const currentEvents = loadSavedEvents();
  const mergedEvents = mergeEventsByDate(currentEvents, incomingEvents);
  const shouldUpdateEvents = !options.onlyIfNewer || JSON.stringify(mergedEvents) !== JSON.stringify(currentEvents);

  if (shouldUpdateEvents) {
    saveEventsToLocalStorage(mergedEvents);
  }

  if (payload.stripDesign) {
    state.stripDesign = { ...createDefaultStripDesign(), ...payload.stripDesign };
    persistStripDesignDraft();
  }
  if (Array.isArray(payload.users)) saveUsers(payload.users);
  if (payload.adminPassword) localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, String(payload.adminPassword));

  renderSavedEvents();
  renderHomeSavedEvents();
  return true;
}

function mergeEventsByDate(currentEvents, incomingEvents) {
  const byId = new Map();
  const deletedIds = new Set(loadDeletedEventIds());
  [...currentEvents, ...incomingEvents].forEach((event) => {
    if (!event || !event.id) return;
    if (deletedIds.has(event.id)) return;
    const existing = byId.get(event.id);
    if (!existing || new Date(event.savedAt || 0) >= new Date(existing.savedAt || 0)) {
      byId.set(event.id, event);
    }
  });
  return [...byId.values()].sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0)).slice(0, 30);
}

function exportBackupFile() {
  persistEventDesign();
  const payload = buildBackupPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `bingo90-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function importBackupFile() {
  const file = els.importBackupInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result || "{}"));
      if (!applyBackupPayload(payload)) throw new Error("Formato invalido");
      scheduleServerStateSave();
      window.alert("Respaldo importado correctamente.");
    } catch {
      window.alert("No se pudo importar el respaldo. Verifica que sea un archivo JSON de Bingo 90.");
    } finally {
      els.importBackupInput.value = "";
      render();
    }
  };
  reader.readAsText(file);
}

function renderStripPreview() {
  applyStripPreviewStyles(els.stripPreview);
  const seriesNumber = clamp(Number(els.stripSeriesInput.value) || 1, 1, 20000);
  els.stripPreview.innerHTML = buildStripSheetHtml(seriesNumber);
  window.requestAnimationFrame(updateStripPreviewScale);
}

async function openVirtualStripPrint(params) {
  const token = params.get("virtual") || "";
  const series = clamp(Number(params.get("series")) || 0, 1, 20000);
  if (!token || !series) {
    document.body.innerHTML = "<p style='font-family:Arial;padding:24px'>No se encontro la tira solicitada.</p>";
    return;
  }
  try {
    const response = await fetch(`/api/virtual/${encodeURIComponent(token)}`, { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "No se pudo abrir la planilla virtual.");
    const sheet = payload.sheet || {};
    const event = payload.event || {};
    const isAssigned = series >= Number(sheet.desde) && series <= Number(sheet.hasta);
    const isSold = (sheet.entries || []).some((entry) => Number(entry.series) === series);
    if (!isAssigned || !isSold) throw new Error("Esta serie no pertenece a la planilla virtual o todavia no esta vendida.");
    applyVirtualStripEvent(event, series);
    const pageDimensions = getPrintPageDimensions();
    const pageSize = getPrintPageSize();
    const html = buildPrintableZipHtml({
      units: [series],
      pages: [[series]],
      selection: {
        units: [series],
        label: "series",
        requestedStart: series,
        requestedEnd: series,
        limited: false,
        nextStart: null,
      },
      partNumber: 1,
      totalParts: 1,
      pageSize,
      pageDimensions,
    });
    document.open();
    document.write(html);
    document.close();
  } catch (error) {
    document.body.innerHTML = `<main style="font-family:Arial;padding:24px;display:grid;gap:12px"><h1>No se pudo generar la tira</h1><p>${escapeHtml(error.message || error)}</p><button onclick="history.back()">Volver</button></main>`;
  }
}

function applyVirtualStripEvent(event, series) {
  const panel = event.bingoPanelSettings || {};
  state.eventId = event.id || createId();
  state.eventName = event.name || "Tira virtual";
  state.eventCreated = true;
  state.eventSeed = panel.eventSeed || event.bingoSeed || event.id || state.eventId;
  state.eventDetail = [event.date, event.town, event.province].filter(Boolean).join(" - ");
  state.combinationMode = panel.combinationMode || "new";
  state.combinationSourceEventId = panel.combinationSourceEventId || "";
  state.designMode = panel.designMode || "new";
  state.designSourceEventId = panel.designSourceEventId || "";
  state.cardMode = panel.cardMode || "series";
  state.rangeStart = 1;
  state.rangeEnd = Math.max(Number(panel.rangeEnd) || 0, series, 15000);
  state.configuredSeriesCount = state.rangeEnd;
  state.salesLoaded = true;
  state.soldUnits = [series];
  state.salesDraftUnits = [series];
  state.cards = [];
  state.cardDesign = { ...state.cardDesign, ...(panel.cardDesign || {}) };
  state.visualSettings = normalizeVisualSettings(panel.visualSettings || {});
  state.stripDesign = { ...createDefaultStripDesign(), ...(panel.stripDesign || {}) };
  state.projectionSettings = normalizeProjectionSettings(panel.projectionSettings || {});
  state.prizeSettings = normalizePrizeSettings({ ...state.prizeSettings, ...(panel.prizeSettings || {}) });
  state.prizeEnabled = { ...state.prizeEnabled, ...(panel.prizeEnabled || {}) };
  state.prizeAmounts = { ...state.prizeAmounts, ...(panel.prizeAmounts || {}) };
}

function applyStripPreviewStyles(target) {
  const pageDimensions = getPrintPageDimensions();
  target.style.width = pageDimensions.width;
  target.style.height = pageDimensions.height;
  target.style.maxWidth = pageDimensions.width;
  target.style.maxHeight = pageDimensions.height;
  target.style.setProperty("--strip-accent", state.stripDesign.accentColor);
  target.style.setProperty("--strip-bg", state.stripDesign.backgroundColor);
  target.style.setProperty("--strip-font-size", `${state.stripDesign.fontSize}px`);
  target.style.setProperty("--strip-font-family", state.stripDesign.fontFamily);
  target.style.setProperty("--strip-series-font-size", `${state.stripDesign.seriesFontSize}px`);
  target.style.setProperty("--strip-series-font-family", state.stripDesign.seriesFontFamily);
  target.style.setProperty("--strip-series-color", state.stripDesign.seriesColor);
  target.style.setProperty("--strip-series-offset-x", `${state.stripDesign.seriesOffsetX || 0}px`);
  target.style.setProperty("--strip-series-offset-y", `${state.stripDesign.seriesOffsetY || 0}px`);
  target.style.setProperty("--strip-number-color", state.stripDesign.numberColor);
  target.style.setProperty("--strip-card-scale", state.stripDesign.cardScale / 100);
  target.style.setProperty("--strip-card-width", `${state.stripDesign.cardScale}%`);
  target.style.setProperty("--strip-cell-size", `${state.stripDesign.cellSize}px`);
  target.style.setProperty("--strip-render-font-size", `${state.stripDesign.fontSize}px`);
  target.style.setProperty("--strip-render-series-font-size", `${state.stripDesign.seriesFontSize}px`);
  target.style.setProperty("--strip-render-cell-size", `${state.stripDesign.cellSize}px`);
  target.style.setProperty("--strip-render-header-height", `${state.stripDesign.headerHeight}px`);
  target.style.setProperty("--strip-render-column-gap", `${state.stripDesign.gap}px`);
  target.style.setProperty("--strip-render-row-gap", `${state.stripDesign.rowGap}px`);
  target.style.setProperty("--strip-render-card-pad-y", "3px");
  target.style.setProperty("--strip-render-card-pad-x", "5px");
  target.style.setProperty("--strip-render-card-header-height", "12px");
  target.style.setProperty("--strip-render-card-title-font-size", `${Math.max(8, state.stripDesign.fontSize * 0.72)}px`);
  target.style.setProperty("--strip-render-small-gap", "2px");
  target.style.setProperty("--strip-cell-radius", getStripCellRadius());
  target.style.setProperty("--strip-cell-border", state.stripDesign.cellBorderColor);
  target.style.setProperty("--strip-cell-bg", state.stripDesign.cellBgEnabled ? state.stripDesign.cellBgColor : "transparent");
  target.style.setProperty("--strip-header-height", `${state.stripDesign.headerHeight}px`);
  target.style.setProperty("--strip-gap", `${state.stripDesign.gap}px`);
  target.style.setProperty("--strip-row-gap", `${state.stripDesign.rowGap}px`);
  target.style.setProperty("--strip-columns", state.stripDesign.columns);
  target.style.setProperty("--strip-offset-x", `${state.stripDesign.offsetX}px`);
  target.style.setProperty("--strip-offset-y", `${state.stripDesign.offsetY}px`);
  target.style.setProperty("--strip-bg-image", state.stripDesign.backgroundImageData ? `url("${state.stripDesign.backgroundImageData}")` : "none");
  target.classList.toggle("paper-a5", state.stripDesign.paperSize === "a5");
  target.classList.toggle("paper-legal", state.stripDesign.paperSize === "legal");
  target.classList.toggle("paper-portrait", state.stripDesign.orientation === "portrait");
}

function updateStripPreviewScale() {
  if (!els.stripPreviewShell || !els.stripPreview) return;
  els.stripPreview.style.transform = "";
  els.stripPreview.style.setProperty("--strip-content-scale", "1");
  state.stripDesign.printContentScale = 1;

  const availableWidth = Math.max(1, els.stripPreviewShell.clientWidth - 18);
  const availableHeight = Math.max(1, els.stripPreviewShell.clientHeight - 18);
  const naturalWidth = Math.max(1, els.stripPreview.offsetWidth);
  const naturalHeight = Math.max(1, els.stripPreview.offsetHeight);
  const scale = Math.min(availableWidth / naturalWidth, availableHeight / naturalHeight, 1);
  els.stripPreview.style.setProperty("--strip-sheet-scale", String(Math.max(0.25, scale)));
}

function getStripCellRadius() {
  if (state.stripDesign.cellShape === "circle") return "999px";
  if (state.stripDesign.cellShape === "rounded") return "6px";
  return "0";
}

function buildStripSheetHtml(firstSeriesNumber) {
  const pageUnits = getPreviewStripPageUnits(firstSeriesNumber);
  const items = pageUnits.map((seriesNumber, index) => {
    const firstCardNumber = ((seriesNumber - 1) * SERIES_SIZE) + 1;
    const cards = createSeries(String(seriesNumber), firstCardNumber);
    if (state.stripDesign.contentMode === "single") {
      return buildSingleCardBlockHtml(seriesNumber, cards[0], index);
    }
    return buildStripHtml(seriesNumber, cards);
  });
  return `
    <div class="strip-page-layout">
      ${items.join("")}
    </div>
  `;
}

function getPreviewStripPageUnits(firstSeriesNumber) {
  const itemsPerPage = Math.max(1, state.stripDesign.itemsPerPage || 1);
  if ((state.stripDesign.orderMode || "consecutive") !== "columnar") {
    return range(firstSeriesNumber, firstSeriesNumber + itemsPerPage - 1);
  }
  const start = Number(els.stripExportFromInput?.value) || state.rangeStart || 1;
  const end = Number(els.stripExportToInput?.value) || state.rangeEnd || start;
  const selectedRange = normalizeRange(start, end);
  const units = range(selectedRange.start, selectedRange.end);
  const pageCount = Math.max(1, Math.ceil(units.length / itemsPerPage));
  const pageIndex = clamp(firstSeriesNumber - selectedRange.start, 0, pageCount - 1);
  return getColumnarPageUnits(units, pageIndex, pageCount, itemsPerPage);
}

function buildStripHtml(seriesNumber, cards) {
  return `
    <div class="strip-block">
      <div class="strip-letterhead"></div>
      <div class="strip-meta">
        <span>${escapeHtml(state.stripDesign.seriesLabel)} ${seriesNumber}</span>
        <span>Cartones N° ${cards[0].cardNumber} al ${cards.at(-1).cardNumber}</span>
      </div>
      <div class="strip-cards">
        ${cards.map((card) => buildStripCardHtml(card)).join("")}
      </div>
    </div>
  `;
}

function buildSingleCardBlockHtml(seriesNumber, card, index) {
  return `
    <div class="strip-block single-card-block">
      <div class="strip-letterhead"></div>
      <div class="strip-meta">
        <span>${escapeHtml(state.stripDesign.seriesLabel)} ${seriesNumber}</span>
        <span>Copia ${index + 1}</span>
      </div>
      <div class="strip-cards single-card-repeat">
        ${buildStripCardHtml(card)}
      </div>
    </div>
  `;
}

function buildStripCardHtml(card) {
  return `
    <article class="strip-card">
      <header>
        <span>Carton N° ${card.cardNumber}</span>
      </header>
      <div class="strip-card-grid">
        ${card.rows.map((row) => `
          <div class="strip-card-row">
            ${row.map((number) => `<span class="${number ? "strip-number" : "strip-empty"}">${number || ""}</span>`).join("")}
          </div>
        `).join("")}
      </div>
    </article>
  `;
}

function buildStripHtml(seriesNumber, cards) {
  return `
    <div class="strip-block">
      <div class="strip-letterhead"></div>
      <div class="strip-meta strip-meta-centered">
        <span>${escapeHtml(state.stripDesign.seriesLabel)} ${seriesNumber}</span>
      </div>
      <div class="strip-cards">
        ${cards.map((card) => buildStripCardHtml(card)).join("")}
      </div>
    </div>
  `;
}

async function exportStripPdf() {
  if (window.bingoDesktop?.savePdfFromHtml) {
    await exportStripDirectPdfFromExactHtml();
    return;
  }
  await exportEventCardsPdf({ useDesignerRange: true });
}

async function exportStripZip() {
  applyStripDesign();
  await syncStripPreviewScaleForExport();
  await exportEventCardsZip({ useDesignerRange: true });
}

async function exportStripDirectPdfFromExactHtml() {
  if (!window.bingoDesktop?.savePdfFromHtml) {
    window.alert("Esta funcion necesita abrirse desde la app de escritorio actualizada.");
    return;
  }
  if (!state.eventCreated) {
    window.alert("Primero selecciona el evento que queres exportar.");
    return;
  }
  applyStripDesign();
  if (!(await ensureCargasPanelSaved())) return;
  await syncStripPreviewScaleForExport();
  const units = getPrintableStripUnits();
  const selection = getPrintableExportSelection(units, { useDesignerRange: true });
  if (!selection.units.length) {
    const label = state.cardMode === "individual" ? "cartones" : "series";
    window.alert(`El rango elegido no tiene ${label} para exportar.`);
    return;
  }

  const button = els.stripExportPdfBtn;
  const previousText = button?.textContent;
  if (button) {
    button.disabled = true;
    button.textContent = "Generando PDF...";
  }

  try {
    const pages = getPrintableStripPages(selection.units);
    const pageSize = getPrintPageSize();
    const pageDimensions = getPrintPageDimensions();
    const fileBase = slugify(state.eventName || "cartones-bingo-90");
    const html = buildPrintableZipHtml({
      units: selection.units,
      pages,
      selection,
      partNumber: 1,
      totalParts: 1,
      pageSize,
      pageDimensions,
    });
    const result = await window.bingoDesktop.savePdfFromHtml({
      suggestedName: `${fileBase}-${selection.requestedStart}-${selection.requestedEnd}.pdf`,
      html,
      printOptions: {
        paperSize: state.stripDesign.paperSize,
        orientation: state.stripDesign.orientation,
      },
    });
    if (result?.canceled) return;
  } catch (error) {
    window.alert(`No se pudo generar el PDF: ${error.message || error}`);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = previousText;
    }
  }
}
async function exportStripPdfZipFromExactHtml() {
  if (!window.bingoDesktop?.savePdfZipFromHtml) {
    window.alert("Esta funcion necesita abrirse desde la app de escritorio actualizada.");
    return;
  }
  if (!state.eventCreated) {
    window.alert("Primero selecciona el evento que queres exportar.");
    return;
  }
  applyStripDesign();
  if (!(await ensureCargasPanelSaved())) return;
  await syncStripPreviewScaleForExport();
  const units = getPrintableStripUnits();
  const selection = getPrintableExportSelection(units, { useDesignerRange: true, ignoreLimit: true });
  if (!selection.units.length) {
    const label = state.cardMode === "individual" ? "cartones" : "series";
    window.alert(`El rango elegido no tiene ${label} para exportar.`);
    return;
  }

  const button = els.stripExportPdfBtn;
  const previousText = button?.textContent;
  if (button) {
    button.disabled = true;
    button.textContent = "Generando PDF...";
  }

  try {
    const itemsPerPage = Math.max(1, state.stripDesign.itemsPerPage || 1);
    const pages = getPrintableStripPages(selection.units);
    const pagesPerFile = getZipPagesPerFile(itemsPerPage);
    const chunks = chunkArray(pages, pagesPerFile);
    const pageSize = getPrintPageSize();
    const pageDimensions = getPrintPageDimensions();
    const totalPages = pages.length;
    const fileBase = slugify(state.eventName || "cartones-bingo-90");
    const files = chunks.map((chunkPages, index) => {
      const partNumber = index + 1;
      const safePart = String(partNumber).padStart(3, "0");
      const chunkUnits = chunkPages.flat();
      return {
        name: `${fileBase}-parte-${safePart}-${chunkUnits[0]}-${chunkUnits.at(-1)}.html`,
        content: buildPrintableZipHtml({
          units: chunkUnits,
          pages: chunkPages,
          selection,
          partNumber,
          totalParts: chunks.length,
          pageSize,
          pageDimensions,
        }),
      };
    });
    const result = await window.bingoDesktop.savePdfZipFromHtml({
      suggestedName: `${fileBase}-pdf-exacto-${selection.requestedStart}-${selection.requestedEnd}.zip`,
      files,
      printOptions: {
        paperSize: state.stripDesign.paperSize,
        orientation: state.stripDesign.orientation,
        totalPages,
      },
    });
    if (result?.canceled) return;
  } catch (error) {
    window.alert(`No se pudo generar el ZIP PDF exacto: ${error.message || error}`);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = previousText;
    }
  }
}
async function exportStripHtmlZip() {
  if (!state.eventCreated) {
    window.alert("Primero selecciona el evento que queres exportar.");
    return;
  }
  applyStripDesign();
  await syncStripPreviewScaleForExport();
  const units = getPrintableStripUnits();
  const selection = getPrintableExportSelection(units, { useDesignerRange: true, ignoreLimit: true });
  if (!selection.units.length) {
    const label = state.cardMode === "individual" ? "cartones" : "series";
    window.alert(`El rango elegido no tiene ${label} para exportar.`);
    return;
  }

  const button = els.stripExportZipBtn;
  const previousText = button?.textContent;
  if (button) {
    button.disabled = true;
    button.textContent = "Generando HTML...";
  }

  try {
    const itemsPerPage = Math.max(1, state.stripDesign.itemsPerPage || 1);
    const pages = getPrintableStripPages(selection.units);
    const pagesPerFile = getZipPagesPerFile(itemsPerPage);
    const chunks = chunkArray(pages, pagesPerFile);
    const pageSize = getPrintPageSize();
    const pageDimensions = getPrintPageDimensions();
    const totalPages = pages.length;
    const fileBase = slugify(state.eventName || "cartones-bingo-90");
    const files = [
      {
        name: "LEEME.txt",
        content: buildZipReadme(selection, chunks.length, totalPages),
      },
      ...chunks.map((chunkPages, index) => {
        const partNumber = index + 1;
        const safePart = String(partNumber).padStart(3, "0");
        const chunkUnits = chunkPages.flat();
        return {
          name: `${fileBase}-parte-${safePart}-${chunkUnits[0]}-${chunkUnits.at(-1)}.html`,
          content: buildPrintableZipHtml({
            units: chunkUnits,
            pages: chunkPages,
            selection,
            partNumber,
            totalParts: chunks.length,
            pageSize,
            pageDimensions,
          }),
        };
      }),
    ];
    const zipBlob = buildStoredZip(files);
    await downloadBlob(`${fileBase}-html-exacto-${selection.requestedStart}-${selection.requestedEnd}.zip`, zipBlob);
  } catch (error) {
    window.alert(`No se pudo generar el ZIP HTML: ${error.message || error}`);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = previousText;
    }
  }
}

async function syncStripPreviewScaleForExport() {
  if (!els.stripDesignerDialog?.open || !els.stripPreview) return;
  await new Promise((resolve) => window.requestAnimationFrame(resolve));
  updateStripPreviewScale();
}

async function exportEventCardsPdf(options = {}) {
  const button = els.stripDesignerDialog?.open ? els.stripExportPdfBtn : els.exportCardsPdfBtn;
  const previousText = button?.textContent;
  if (button) {
    button.disabled = true;
    button.textContent = "Preparando PDF...";
  }
  try {
    if (!state.eventCreated) {
      window.alert("Primero selecciona el evento que queres exportar.");
      return;
    }
    if (els.stripDesignerDialog?.open) {
      applyStripDesign();
    } else {
      persistEventDesign();
    }
    if (!(await ensureCargasPanelSaved())) return;
    const units = getPrintableStripUnits();
    if (!units.length) {
      window.alert("Primero configura el evento para generar cartones.");
      return;
    }
    const exportSelection = getPrintableExportSelection(units, options);
    const exportUnits = exportSelection.units;
    if (!exportUnits.length) {
      const label = state.cardMode === "individual" ? "cartones" : "series";
      window.alert(`El rango elegido no tiene ${label} para exportar.`);
      return;
    }
    const pageCount = getPrintableStripPages(exportUnits).length;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.alert("El navegador bloqueo la ventana de impresion. Habilita ventanas emergentes para exportar PDF.");
      return;
    }
    if (exportSelection.limited && els.stripDesignerDialog?.open) {
      els.stripExportFromInput.value = exportSelection.nextStart;
    }
    writePrintLoadingPage(printWindow, exportSelection, pageCount);
    await new Promise((resolve) => setTimeout(resolve, 80));
    const styles = [...document.querySelectorAll("style,link[rel='stylesheet']")]
      .map((node) => node.outerHTML)
      .join("");
    const pageSize = getPrintPageSize();
    const pageDimensions = getPrintPageDimensions();
    const pagesHtml = buildPrintableStripPagesHtml(exportUnits);
    const fileName = slugify(state.eventName || "cartones-bingo-90");
    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <title>${escapeHtml(state.eventName || "Cartones Bingo 90")} - PDF</title>
          ${styles}
          <style>
            *{box-sizing:border-box}
            html,body{background:#cbd5e1;margin:0;padding:0;width:100%;min-height:100%}
            body{display:block;overflow-x:hidden}
            .print-toolbar{position:sticky;top:0;right:0;left:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;background:#111827;color:#fff;font-family:Arial,Helvetica,sans-serif}
            .print-toolbar-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
            .print-toolbar button{border:0;border-radius:6px;padding:9px 13px;background:#e11d48;color:#fff;font-weight:800;cursor:pointer}
            .print-toolbar button.secondary{background:#0f766e}
            .print-toolbar button.whatsapp{background:#16a34a}
            .print-note{font-size:13px;color:#cbd5e1}
            .print-pages{padding-top:0;display:grid;place-items:start center;min-height:100vh}
            .strip-preview.print-page{width:${pageDimensions.width};height:${pageDimensions.height};max-width:${pageDimensions.width};max-height:${pageDimensions.height};box-shadow:none;border:0;border-radius:0;min-height:auto;overflow:hidden;page-break-after:always;break-after:page;margin:0 auto;print-color-adjust:exact;-webkit-print-color-adjust:exact}
            .strip-preview.print-page:last-child{page-break-after:auto;break-after:auto}
            .strip-page-layout{height:100%;align-content:start}
            .strip-card{break-inside:avoid}
            @page{size:${pageSize};margin:0}
            @media print{html,body{width:100%;height:auto;overflow:visible}.print-toolbar{display:none}.print-pages{padding-top:0}.strip-preview.print-page{width:${pageDimensions.width};height:${pageDimensions.height};max-width:${pageDimensions.width};max-height:${pageDimensions.height};overflow:hidden;margin:0 auto}.strip-card{break-inside:avoid}}
          </style>
        </head>
        <body>
          <div class="print-toolbar">
            <strong>${escapeHtml(state.eventName || "Cartones Bingo 90")}</strong>
            <span class="print-note">${buildPrintToolbarNote(exportSelection, pageCount, fileName)}. Cuando cargue la vista, toca Guardar como PDF.</span>
            <div class="print-toolbar-actions">
              <button class="secondary" type="button" data-download-jpg>Descargar JPG</button>
              <button class="whatsapp" type="button" data-whatsapp-jpg>Enviar por WhatsApp</button>
              <button type="button" onclick="window.print()">Guardar como PDF</button>
            </div>
          </div>
          <main class="print-pages">${pagesHtml}</main>
          ${buildPrintableJpgActionsScript({
            fileName: `${fileName}-${exportSelection.requestedStart}-${exportSelection.requestedEnd}.jpg`,
            whatsappText: `Tira de bingo ${state.eventName || "Cartones Bingo 90"} - ${exportSelection.label} ${exportSelection.requestedStart}-${exportSelection.requestedEnd}`,
            eventName: state.eventName || "Cartones Bingo 90",
            footerText: buildStripShareFooterText(),
          })}
        </body>
      </html>`);
    printWindow.document.close();
  } catch (error) {
    window.alert(`No se pudo preparar el PDF: ${error.message || error}`);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = previousText;
    }
  }
}

async function exportEventCardsZip(options = {}) {
  if (!state.eventCreated) {
    window.alert("Primero selecciona el evento que queres exportar.");
    return;
  }
  if (els.stripDesignerDialog?.open) {
    applyStripDesign();
  } else {
    persistEventDesign();
  }
  if (!(await ensureCargasPanelSaved())) return;
  saveCurrentEvent({ silent: true });
  const serverSaved = await saveServerState();
  if (!serverSaved) {
    window.alert("No se pudo preparar el ZIP porque el servidor local no guardo el evento. Cerra y volve a abrir la app desde el icono, y proba nuevamente.");
    return;
  }

  const units = getPrintableStripUnits();
  const selection = getPrintableExportSelection(units, { ...options, ignoreLimit: true });
  const button = options.sourceButton || els.stripExportZipBtn;
  const previousText = button?.textContent;
  if (button) {
    button.disabled = true;
    button.textContent = "Generando ZIP PDF...";
  }
  try {
    const params = new URLSearchParams({
      eventId: state.eventId,
      eventName: state.eventName,
      from: String(selection.requestedStart),
      to: String(selection.requestedEnd),
      limit: String(Number(els.stripExportLimitInput?.value) || 0),
    });
    const checkResponse = await fetch(`/api/export-strip-zip?${params.toString()}&check=1`, { cache: "no-store" });
    const checkText = await checkResponse.text();
    let checkPayload = {};
    try {
      checkPayload = JSON.parse(checkText || "{}");
    } catch {
      checkPayload = {};
    }
    if (!checkResponse.ok || !checkPayload.ok) {
      throw new Error(checkPayload.error || `El servidor no respondio la exportacion PDF. Estado ${checkResponse.status}. Respuesta: ${checkText.slice(0, 120) || "vacia"}`);
    }
    if (checkPayload.format !== "pdf") {
      throw new Error("El servidor que esta abierto todavia es el viejo y genera archivos web. Cerra la ventana negra del servidor, cerra esta pestana y abri de nuevo desde CLICK AQUI - ABRIR BINGO 90.bat.");
    }
    const exportResponse = await fetch(`/api/export-strip-zip?${params.toString()}`, { cache: "no-store" });
    if (!exportResponse.ok) {
      const exportText = await exportResponse.text();
      throw new Error(`No se pudo descargar el ZIP PDF. Estado ${exportResponse.status}. Respuesta: ${exportText.slice(0, 120) || "vacia"}`);
    }
    const zipBlob = await exportResponse.blob();
    await downloadBlob(checkPayload.fileName || `${slugify(state.eventName || "cartones-bingo-90")}-pdf-${selection.requestedStart}-${selection.requestedEnd}.zip`, zipBlob);
  } catch (error) {
    window.alert(`No se pudo generar el ZIP: ${error.message || error}`);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = previousText;
    }
  }
}

async function loadCargasEvent(eventId, options = {}) {
  try {
    const response = await fetch("/api/state", { cache: "no-store", credentials: "same-origin" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return false;
    const event = (payload.events || []).find((item) => String(item.id) === String(eventId));
    if (!event) return false;
    loadEventData(buildBingoEventFromCargas(event), options);
    return true;
  } catch {
    return false;
  }
}

function buildBingoEventFromCargas(event) {
  const panel = event.bingoPanelSettings || {};
  const soldUnits = getCargasOfficialSoldUnits(event);
  const maxSold = Math.max(0, ...soldUnits);
  const rangeStart = Number(panel.rangeStart) || 1;
  const rangeEnd = Math.max(15000, Number(panel.rangeEnd) || 0, Number(event.bingoRangeEnd) || 0, maxSold);
  const drawn = Array.isArray(panel.drawn)
    ? panel.drawn
    : (Array.isArray(event.bingoGame?.drawn) ? event.bingoGame.drawn : []);
  return {
    ...panel,
    id: event.id,
    name: event.name || panel.name || "Evento confirmado",
    eventCreated: true,
    eventSeed: panel.eventSeed || event.bingoSeed || event.id,
    eventDetail: [event.date, event.town, event.province].filter(Boolean).join(" - "),
    combinationMode: panel.combinationMode || "new",
    combinationSourceEventId: panel.combinationSourceEventId || "",
    designMode: panel.designMode || "new",
    designSourceEventId: panel.designSourceEventId || "",
    cardMode: panel.cardMode || "series",
    rangeStart,
    rangeEnd,
    configuredSeriesCount: Math.max(1, rangeEnd - rangeStart + 1),
    salesLoaded: true,
    soldUnits,
    salesDraftUnits: soldUnits,
    drawn,
    savedAt: panel.savedAt || new Date().toISOString(),
    cardDesign: panel.cardDesign || {},
    visualSettings: panel.visualSettings || {},
    stripDesign: panel.stripDesign || {},
    projectionSettings: panel.projectionSettings || {},
  };
}

function getCargasOfficialSoldUnits(event) {
  const closure = event.bingoClosure || {};
  if (Array.isArray(closure.soldUnits) && (closure.status === "confirmed" || closure.reopenedAt)) {
    return normalizeSoldUnits(closure.soldUnits);
  }
  return normalizeSoldUnits((event.sales || []).flatMap((sale) => range(Number(sale.desde) || 0, Number(sale.hasta) || 0)));
}

function getPrintableExportSelection(units, options = {}) {
  const label = state.cardMode === "individual" ? "cartones" : "series";
  const fallbackSelection = {
    units,
    label,
    requestedCount: units.length,
    requestedStart: units[0],
    requestedEnd: units.at(-1),
    limited: false,
    nextStart: null,
  };
  if (!options.useDesignerRange) return fallbackSelection;
  const rawStart = Number(els.stripExportFromInput?.value);
  const rawEnd = Number(els.stripExportToInput?.value);
  if (!Number.isFinite(rawStart) || !Number.isFinite(rawEnd)) return fallbackSelection;
  const selectedRange = normalizeRange(rawStart, rawEnd);
  const availableStart = units[0];
  const availableEnd = units.at(-1);
  const start = Math.max(selectedRange.start, availableStart);
  const end = Math.min(selectedRange.end, availableEnd);
  const selectedUnits = start <= end ? units.filter((unit) => unit >= start && unit <= end) : [];
  const exportLimit = options.ignoreLimit ? 0 : clamp(Number(els.stripExportLimitInput?.value) || 0, 0, 20000);
  const limited = exportLimit > 0 && selectedUnits.length > exportLimit;
  const exportUnits = limited ? selectedUnits.slice(0, exportLimit) : selectedUnits;
  return {
    units: exportUnits,
    label,
    requestedCount: selectedUnits.length,
    requestedStart: start,
    requestedEnd: end,
    limited,
    nextStart: limited ? selectedUnits[exportLimit] : null,
  };
}

function getSafePrintableUnits(units) {
  const pageCount = Math.ceil(units.length / Math.max(1, state.stripDesign.itemsPerPage));
  if (pageCount <= 250) return units;
  const first = units[0];
  const last = units.at(-1);
  const label = state.cardMode === "individual" ? "cartones" : "series";
  const suggestedEnd = Math.min(first + 199, last);
  const rangeText = window.prompt(
    `El PDF completo tiene ${pageCount} paginas y puede trabar el navegador.\n` +
    `Podes exportar por partes. Escribi rango de ${label}, por ejemplo ${first}-${suggestedEnd}.\n` +
    "Deja vacio para intentar exportar todo.",
    `${first}-${suggestedEnd}`,
  );
  if (rangeText === null) return [];
  if (!rangeText.trim()) return units;
  const match = rangeText.match(/(\d+)\D+(\d+)/);
  if (!match) {
    window.alert("Rango invalido. Usa un formato como 1-200.");
    return [];
  }
  const safe = normalizeRange(Number(match[1]), Number(match[2]));
  return units.filter((unit) => unit >= safe.start && unit <= safe.end);
}

function buildPrintToolbarNote(selection, pageCount, fileName) {
  const base = `${selection.units.length} ${selection.label} - ${pageCount} paginas. Destino sugerido: Guardar como PDF. Nombre: ${escapeHtml(fileName)}.pdf`;
  if (!selection.limited) return base;
  return `${base}. Quedan pendientes: desde ${selection.nextStart} hasta ${selection.requestedEnd}.`;
}

function buildStripShareFooterText() {
  const datePart = String(state.eventDetail || "").split(" - ")[0] || "";
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const formatted = match ? `${match[3]}/${match[2]}/${match[1].slice(2)}` : datePart;
  return formatted ? `Esta tira pertenece al sorteo del dia ${formatted}` : "";
}

function buildPrintableJpgActionsScript({ fileName, whatsappText, eventName, footerText }) {
  const safeFileName = JSON.stringify(fileName || "tira-bingo.jpg").replace(/<\/script/gi, "<\\/script");
  const safeWhatsappText = JSON.stringify(whatsappText || "Tira de bingo").replace(/<\/script/gi, "<\\/script");
  const safeEventName = JSON.stringify(eventName || "Tira de bingo").replace(/<\/script/gi, "<\\/script");
  const safeFooterText = JSON.stringify(footerText || "").replace(/<\/script/gi, "<\\/script");
  return `<script>
    (() => {
      const jpgFileName = ${safeFileName};
      const whatsappText = ${safeWhatsappText};
      const jpgEventName = ${safeEventName};
      const jpgFooterText = ${safeFooterText};
      const getStyleText = () => Array.from(document.styleSheets).map((sheet) => {
        try {
          return Array.from(sheet.cssRules || []).map((rule) => rule.cssText).join("\\n");
        } catch {
          return "";
        }
      }).filter(Boolean).join("\\n");
      const loadImage = (src) => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("No se pudo generar el JPG de la tira."));
        image.src = src;
      });
      function drawRoundRect(ctx, x, y, width, height, radius) {
        const safeRadius = Math.max(0, Math.min(radius || 0, width / 2, height / 2));
        ctx.beginPath();
        ctx.moveTo(x + safeRadius, y);
        ctx.lineTo(x + width - safeRadius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
        ctx.lineTo(x + width, y + height - safeRadius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
        ctx.lineTo(x + safeRadius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
        ctx.lineTo(x, y + safeRadius);
        ctx.quadraticCurveTo(x, y, x + safeRadius, y);
        ctx.closePath();
      }
      function isVisibleColor(value) {
        return value && value !== "transparent" && value !== "rgba(0, 0, 0, 0)";
      }
      async function createManualJpgBlob() {
        const page = document.querySelector(".strip-preview.print-page");
        const content = document.querySelector(".strip-preview.print-page .strip-page-layout");
        if (!page || !content) throw new Error("No se encontro la tira para dibujar el JPG.");
        const nodes = Array.from(content.querySelectorAll(".strip-meta span, .strip-card")).filter((node) => {
          const rect = node.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
        if (!nodes.length) throw new Error("No se encontraron cartones para dibujar el JPG.");
        const bounds = nodes.reduce((acc, node) => {
          const rect = node.getBoundingClientRect();
          return {
            left: Math.min(acc.left, rect.left),
            top: Math.min(acc.top, rect.top),
            right: Math.max(acc.right, rect.right),
            bottom: Math.max(acc.bottom, rect.bottom),
          };
        }, { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });
        const contentWidth = Math.ceil(bounds.right - bounds.left);
        const contentHeight = Math.ceil(bounds.bottom - bounds.top);
        const padding = 16;
        const borderWidth = 4;
        const headerHeight = 54;
        const footerHeight = jpgFooterText ? 34 : 14;
        const width = Math.max(260, Math.ceil(contentWidth + padding * 2));
        const height = Math.max(1, Math.ceil(contentHeight + padding * 2 + headerHeight + footerHeight));
        const scale = 3;
        const canvas = document.createElement("canvas");
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext("2d");
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = "#111827";
        ctx.lineWidth = borderWidth;
        drawRoundRect(ctx, borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth, 28);
        ctx.stroke();
        const accent = getComputedStyle(page).getPropertyValue("--strip-accent").trim() || "#d1223b";
        ctx.fillStyle = accent;
        ctx.font = "800 20px Arial, Helvetica, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(jpgEventName, width / 2, 28, width - padding * 2);
        ctx.fillStyle = "#111827";
        ctx.font = "700 12px Arial, Helvetica, sans-serif";
        ctx.fillText(whatsappText, width / 2, 48, width - padding * 2);
        const offsetX = padding - bounds.left + (width - padding * 2 - contentWidth) / 2;
        const offsetY = padding + headerHeight - bounds.top;
        const boxes = content.querySelectorAll(".strip-block, .strip-card, .strip-card-grid, .strip-card-row, .strip-number, .strip-empty");
        boxes.forEach((node) => {
          const rect = node.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const style = getComputedStyle(node);
          const x = rect.left + offsetX;
          const y = rect.top + offsetY;
          const radius = parseFloat(style.borderRadius) || 0;
          const bg = style.backgroundColor;
          if (isVisibleColor(bg)) {
            ctx.fillStyle = bg;
            drawRoundRect(ctx, x, y, rect.width, rect.height, radius);
            ctx.fill();
          }
          const borderColor = style.borderTopColor;
          const lineWidth = parseFloat(style.borderTopWidth) || 0;
          if (lineWidth > 0 && isVisibleColor(borderColor)) {
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = lineWidth;
            drawRoundRect(ctx, x + lineWidth / 2, y + lineWidth / 2, rect.width - lineWidth, rect.height - lineWidth, radius);
            ctx.stroke();
          }
        });
        const textNodes = content.querySelectorAll(".strip-meta span, .strip-card header span, .strip-number");
        textNodes.forEach((node) => {
          const text = (node.textContent || "").trim();
          if (!text) return;
          const rect = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          ctx.fillStyle = style.color || "#111827";
          ctx.font = (style.fontWeight || "700") + " " + (style.fontSize || "14px") + " " + (style.fontFamily || "Arial");
          ctx.textBaseline = "middle";
          const x = rect.left + offsetX + rect.width / 2;
          const y = rect.top + offsetY + rect.height / 2;
          ctx.textAlign = "center";
          ctx.fillText(text, x, y, Math.max(8, rect.width - 2));
        });
        if (jpgFooterText) {
          ctx.fillStyle = "#111827";
          ctx.font = "800 13px Arial, Helvetica, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(jpgFooterText, width / 2, height - 20, width - padding * 2);
        }
        return await new Promise((resolve, reject) => {
          canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No se pudo crear el archivo JPG.")), "image/jpeg", 0.94);
        });
      }
      async function createJpgBlob() {
        const page = document.querySelector(".strip-preview.print-page");
        const content = document.querySelector(".strip-preview.print-page .strip-page-layout") || page;
        if (!page || !content) throw new Error("No se encontro la tira para convertir a JPG.");
        const contentRect = content.getBoundingClientRect();
        const padding = 18;
        const width = Math.max(1, Math.ceil(contentRect.width + padding * 2));
        const height = Math.max(1, Math.ceil(contentRect.height + padding * 2));
        const clonePage = page.cloneNode(true);
        const cloneContent = clonePage.querySelector(".strip-page-layout") || clonePage;
        clonePage.classList.add("jpg-export-page");
        clonePage.style.width = width + "px";
        clonePage.style.height = height + "px";
        clonePage.style.maxWidth = width + "px";
        clonePage.style.maxHeight = height + "px";
        clonePage.style.margin = "0";
        clonePage.style.padding = padding + "px";
        clonePage.style.border = "4px solid #111827";
        clonePage.style.borderRadius = "28px";
        clonePage.style.overflow = "hidden";
        clonePage.style.display = "grid";
        clonePage.style.placeItems = "center";
        clonePage.style.transform = "none";
        cloneContent.style.transform = "none";
        cloneContent.style.margin = "0";
        cloneContent.style.width = "max-content";
        cloneContent.style.height = "max-content";
        const styleText = getStyleText()
          .replace(/url\\([^)]*\\)/gi, "none")
          .replace(/<\\/style/gi, "<\\\\/style");
        const html = '<div xmlns="http://www.w3.org/1999/xhtml"><style>' + styleText + '.jpg-export-page{box-sizing:border-box;}</style>' + clonePage.outerHTML + '</div>';
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '"><foreignObject width="100%" height="100%">' + html + '</foreignObject></svg>';
        const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
        try {
          const image = await loadImage(url);
          const scale = 2;
          const canvas = document.createElement("canvas");
          canvas.width = width * scale;
          canvas.height = height * scale;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.setTransform(scale, 0, 0, scale, 0, 0);
          ctx.drawImage(image, 0, 0);
          return await new Promise((resolve, reject) => {
            canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No se pudo crear el archivo JPG.")), "image/jpeg", 0.92);
          });
        } catch {
          return createManualJpgBlob();
        } finally {
          URL.revokeObjectURL(url);
        }
      }
      async function downloadJpg() {
        const blob = await createJpgBlob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = jpgFileName;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          URL.revokeObjectURL(link.href);
          link.remove();
        }, 800);
        return blob;
      }
      async function sendWhatsapp() {
        const whatsappWindow = window.open("about:blank", "_blank");
        try {
          const blob = await createJpgBlob();
          const file = new File([blob], jpgFileName, { type: "image/jpeg" });
          if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
            if (whatsappWindow) whatsappWindow.close();
            await navigator.share({ files: [file], text: whatsappText, title: jpgFileName });
            return;
          }
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = jpgFileName;
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            URL.revokeObjectURL(link.href);
            link.remove();
          }, 800);
          if (whatsappWindow) {
            whatsappWindow.location.href = "https://web.whatsapp.com/send?text=" + encodeURIComponent(whatsappText);
          } else {
            window.open("https://web.whatsapp.com/send?text=" + encodeURIComponent(whatsappText), "_blank");
          }
          window.alert("Se descargo el JPG. WhatsApp Web se abre aparte; adjunta la imagen desde Descargas.");
        } catch (error) {
          if (whatsappWindow) whatsappWindow.close();
          window.alert(error.message || "No se pudo preparar el JPG para WhatsApp.");
        }
      }
      document.querySelector("[data-download-jpg]")?.addEventListener("click", async () => {
        try {
          await downloadJpg();
        } catch (error) {
          window.alert(error.message || "No se pudo descargar el JPG.");
        }
      });
      document.querySelector("[data-whatsapp-jpg]")?.addEventListener("click", sendWhatsapp);
    })();
  </script>`;
}

function buildPrintableZipHtml({ units, pages, selection, partNumber, totalParts, pageSize, pageDimensions }) {
  const pageCount = pages?.length || Math.ceil(units.length / Math.max(1, state.stripDesign.itemsPerPage));
  const first = units[0];
  const last = units.at(-1);
  const title = `${state.eventName || "Cartones Bingo 90"} - parte ${partNumber}`;
  const styles = getExportStylesHtml();
  return `<!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(title)}</title>
        ${styles}
        <style>
          *{box-sizing:border-box}
          html,body{background:#cbd5e1;margin:0;padding:0;width:100%;min-height:100%}
          body{display:block;overflow-x:hidden}
          .print-toolbar{position:fixed;top:0;right:0;left:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;background:#111827;color:#fff;font-family:Arial,Helvetica,sans-serif}
          .print-toolbar-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
          .print-toolbar button{border:0;border-radius:6px;padding:9px 13px;background:#e11d48;color:#fff;font-weight:800;cursor:pointer}
          .print-toolbar button.secondary{background:#0f766e}
          .print-toolbar button.whatsapp{background:#16a34a}
          .print-note{font-size:13px;color:#cbd5e1}
          .print-pages{padding-top:0;display:grid;place-items:start center;min-height:100vh}
          .strip-preview.print-page{width:${pageDimensions.width};height:${pageDimensions.height};max-width:${pageDimensions.width};max-height:${pageDimensions.height};box-shadow:none;border:0;border-radius:0;min-height:auto;overflow:hidden;page-break-after:always;break-after:page;margin:0 auto;print-color-adjust:exact;-webkit-print-color-adjust:exact}
          .strip-preview.print-page:last-child{page-break-after:auto;break-after:auto}
          .strip-page-layout{height:100%;align-content:start}
          .strip-card{break-inside:avoid}
          @page{size:${pageSize};margin:0}
          @media screen{.print-toolbar{opacity:.92;transform:translateY(calc(-100% + 8px));transition:.15s}.print-toolbar:hover{transform:translateY(0)}}
          @media print{html,body{width:100%;height:auto;overflow:visible}.print-toolbar{display:none}.print-pages{padding-top:0}.strip-preview.print-page{width:${pageDimensions.width};height:${pageDimensions.height};max-width:${pageDimensions.width};max-height:${pageDimensions.height};overflow:hidden;margin:0 auto}.strip-card{break-inside:avoid}}
        </style>
      </head>
      <body>
        <div class="print-toolbar">
          <strong>${escapeHtml(state.eventName || "Cartones Bingo 90")}</strong>
          <span class="print-note">Parte ${partNumber} de ${totalParts}. ${selection.label}: ${first}-${last}. ${pageCount} paginas.</span>
          <div class="print-toolbar-actions">
            <button class="secondary" type="button" data-download-jpg>Descargar JPG</button>
            <button class="whatsapp" type="button" data-whatsapp-jpg>Enviar por WhatsApp</button>
            <button type="button" onclick="window.print()">Imprimir / Guardar como PDF</button>
          </div>
        </div>
        <main class="print-pages">${buildPrintableStripPagesHtml(pages || units)}</main>
        ${buildPrintableJpgActionsScript({
          fileName: `${slugify(state.eventName || "cartones-bingo-90")}-parte-${String(partNumber).padStart(3, "0")}-${first}-${last}.jpg`,
          whatsappText: `Tira de bingo ${state.eventName || "Cartones Bingo 90"} - ${selection.label} ${first}-${last}`,
          eventName: state.eventName || "Cartones Bingo 90",
          footerText: buildStripShareFooterText(),
        })}
      </body>
    </html>`;
}

function buildZipReadme(selection, totalParts, totalPages) {
  return [
    `Evento: ${state.eventName || "Cartones Bingo 90"}`,
    `Rango exportado: ${selection.requestedStart}-${selection.requestedEnd}`,
    `Cantidad: ${selection.units.length} ${selection.label}`,
    `Paginas estimadas: ${totalPages}`,
    `Archivos imprimibles: ${totalParts}`,
    "",
    "Modo de uso:",
    "1. Descomprimir este archivo ZIP.",
    "2. Abrir cada archivo parte-001, parte-002, etc. en Chrome o Edge.",
    "3. Tocar Imprimir / Guardar como PDF.",
    "4. Elegir impresora o Guardar como PDF.",
    "",
    "Esto evita preparar miles de paginas en una sola ventana del navegador.",
  ].join("\r\n");
}

function getZipUnitsPerFile(itemsPerPage) {
  const configured = Number(els.stripExportLimitInput?.value) || 0;
  if (configured > 0) return clamp(configured, itemsPerPage, 2000);
  return Math.max(itemsPerPage, itemsPerPage * 100);
}

function getZipPagesPerFile(itemsPerPage) {
  return Math.max(1, Math.ceil(getZipUnitsPerFile(itemsPerPage) / Math.max(1, itemsPerPage)));
}

function getExportStylesHtml() {
  const css = [...document.styleSheets]
    .map((sheet) => {
      try {
        return [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
      } catch {
        return "";
      }
    })
    .filter(Boolean)
    .join("\n");
  if (css.trim()) return `<style>${css.replace(/<\/style/gi, "<\\/style")}</style>`;
  return `<link rel="stylesheet" href="styles.css">`;
}

function chunkArray(items, chunkSize) {
  const safeSize = Math.max(1, Number(chunkSize) || 1);
  const chunks = [];
  for (let index = 0; index < items.length; index += safeSize) {
    chunks.push(items.slice(index, index + safeSize));
  }
  return chunks;
}

function writePrintLoadingPage(printWindow, selection, pageCount) {
  const pendingText = selection.limited
    ? `<br>Este es el primer bloque de ${selection.requestedCount}. Luego continua desde ${selection.nextStart} hasta ${selection.requestedEnd}.`
    : "";
  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Preparando PDF</title>
        <style>
          body{margin:0;display:grid;place-items:center;min-height:100vh;background:#111827;color:#fff;font-family:Arial,Helvetica,sans-serif}
          div{max-width:520px;text-align:center}
          strong{display:block;font-size:28px;margin-bottom:10px;color:#ffcb45}
          span{color:#cbd5e1}
        </style>
      </head>
      <body>
        <div>
          <strong>Preparando PDF...</strong>
          <span>${selection.units.length} ${selection.label} - ${pageCount} paginas. Espera unos segundos.${pendingText}</span>
        </div>
      </body>
    </html>`);
  printWindow.document.close();
}

function getPrintableStripUnits() {
  if (!state.eventCreated) return [];
  return range(state.rangeStart, state.rangeEnd);
}

function buildPrintableStripPagesHtml(unitsOrPages) {
  const pages = Array.isArray(unitsOrPages?.[0])
    ? unitsOrPages
    : getPrintableStripPages(unitsOrPages);
  return pages.map((pageUnits) => buildPrintableStripPageHtml(pageUnits)).join("");
}

function getPrintableStripPages(units) {
  const itemsPerPage = Math.max(1, state.stripDesign.itemsPerPage);
  const pages = [];
  if ((state.stripDesign.orderMode || "consecutive") === "columnar") {
    const pageCount = Math.max(1, Math.ceil(units.length / itemsPerPage));
    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      pages.push(getColumnarPageUnits(units, pageIndex, pageCount, itemsPerPage));
    }
    return pages;
  }
  for (let index = 0; index < units.length; index += itemsPerPage) {
    pages.push(units.slice(index, index + itemsPerPage));
  }
  return pages;
}

function getColumnarPageUnits(units, pageIndex, pageCount, itemsPerPage) {
  const pageUnits = [];
  for (let columnIndex = 0; columnIndex < itemsPerPage; columnIndex += 1) {
    const unit = units[pageIndex + (columnIndex * pageCount)];
    if (unit !== undefined) pageUnits.push(unit);
  }
  return pageUnits;
}

function buildPrintableStripPageHtml(units) {
  return `
    <div class="strip-preview print-page" style="${buildStripPrintStyleAttribute()}">
      <div class="strip-page-layout">
        ${units.map((unit, index) => buildPrintableStripUnitHtml(unit, index)).join("")}
      </div>
    </div>
  `;
}

function buildPrintableStripUnitHtml(unit, index) {
  if (state.stripDesign.contentMode === "single" || state.cardMode === "individual") {
    return buildSingleCardBlockHtml(unit, getPrintableCardForUnit(unit), index);
  }
  return buildStripHtml(unit, getPrintableCardsForSeries(unit));
}

function getPrintableCardsForSeries(seriesNumber) {
  const existingCards = state.cards
    .filter((card) => card.mode === "series" && Number(card.series) === Number(seriesNumber))
    .sort((a, b) => (a.cardPositionInSeries || a.cardNumber) - (b.cardPositionInSeries || b.cardNumber));
  if (existingCards.length === SERIES_SIZE) return existingCards;
  return createSeries(String(seriesNumber), getFirstCardNumberForSeries(seriesNumber));
}

function getPrintableCardForUnit(unit) {
  if (state.cardMode === "individual") {
    return state.cards.find((card) => card.mode === "individual" && Number(card.cardNumber) === Number(unit))
      || createIndividualCard(unit);
  }
  return getPrintableCardsForSeries(unit)[0];
}

function buildStripPrintStyleAttribute() {
  const bgImage = state.stripDesign.backgroundImageData ? `url('${state.stripDesign.backgroundImageData}')` : "none";
  return [
    `--strip-accent:${state.stripDesign.accentColor}`,
    `--strip-bg:${state.stripDesign.backgroundColor}`,
    `--strip-font-size:${state.stripDesign.fontSize}px`,
    `--strip-font-family:${state.stripDesign.fontFamily}`,
    `--strip-series-font-size:${state.stripDesign.seriesFontSize}px`,
    `--strip-series-font-family:${state.stripDesign.seriesFontFamily}`,
    `--strip-series-color:${state.stripDesign.seriesColor}`,
    `--strip-series-offset-x:${state.stripDesign.seriesOffsetX || 0}px`,
    `--strip-series-offset-y:${state.stripDesign.seriesOffsetY || 0}px`,
    `--strip-number-color:${state.stripDesign.numberColor}`,
    `--strip-card-scale:${state.stripDesign.cardScale / 100}`,
    `--strip-card-width:${state.stripDesign.cardScale}%`,
    `--strip-cell-size:${state.stripDesign.cellSize}px`,
    `--strip-render-font-size:${state.stripDesign.fontSize}px`,
    `--strip-render-series-font-size:${state.stripDesign.seriesFontSize}px`,
    `--strip-render-cell-size:${state.stripDesign.cellSize}px`,
    `--strip-render-header-height:${state.stripDesign.headerHeight}px`,
    `--strip-render-column-gap:${state.stripDesign.gap}px`,
    `--strip-render-row-gap:${state.stripDesign.rowGap}px`,
    "--strip-render-card-pad-y:3px",
    "--strip-render-card-pad-x:5px",
    "--strip-render-card-header-height:12px",
    `--strip-render-card-title-font-size:${Math.max(8, state.stripDesign.fontSize * 0.72)}px`,
    "--strip-render-small-gap:2px",
    `--strip-cell-radius:${getStripCellRadius()}`,
    `--strip-cell-border:${state.stripDesign.cellBorderColor}`,
    `--strip-cell-bg:${state.stripDesign.cellBgEnabled ? state.stripDesign.cellBgColor : "transparent"}`,
    `--strip-header-height:${state.stripDesign.headerHeight}px`,
    `--strip-gap:${state.stripDesign.gap}px`,
    `--strip-row-gap:${state.stripDesign.rowGap}px`,
    `--strip-columns:${state.stripDesign.columns}`,
    `--strip-offset-x:${state.stripDesign.offsetX}px`,
    `--strip-offset-y:${state.stripDesign.offsetY}px`,
    `--strip-content-scale:1`,
    `--strip-bg-image:${bgImage}`,
  ].join(";");
}

function getPrintPageSize() {
  const size = {
    a4: "A4",
    a5: "A5",
    legal: "legal",
  }[state.stripDesign.paperSize] || "A4";
  return `${size} ${state.stripDesign.orientation}`;
}

function getPrintPageDimensions() {
  const sizes = {
    a4: { width: 210, height: 297 },
    a5: { width: 148, height: 210 },
    legal: { width: 216, height: 356 },
  };
  const base = sizes[state.stripDesign.paperSize] || sizes.a4;
  const isLandscape = state.stripDesign.orientation === "landscape";
  const pageWidth = isLandscape ? base.height : base.width;
  const pageHeight = isLandscape ? base.width : base.height;
  const marginTotal = 0;

  return {
    width: `${Math.max(1, pageWidth - marginTotal)}mm`,
    height: `${Math.max(1, pageHeight - marginTotal)}mm`,
  };
}

function deleteEvent(eventId) {
  const event = loadSavedEvents().find((item) => item.id === eventId);
  if (!event) return;
  const confirmed = window.confirm(`Eliminar el evento "${event.name}"? Esta accion no se puede deshacer.`);
  if (!confirmed) return;
  rememberDeletedEvent(eventId);
  const nextEvents = loadSavedEvents().filter((item) => item.id !== eventId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEvents));
  scheduleServerStateSave();
  if (state.eventId === eventId) {
    resetActiveEventToHome();
  }
  render();
}

function resetActiveEventToHome() {
  state.eventId = createId();
  state.eventSeed = createId();
  state.eventCreated = false;
  state.eventName = "";
  state.eventDetail = "";
  state.combinationMode = "new";
  state.combinationSourceEventId = "";
  state.designMode = "new";
  state.designSourceEventId = "";
  state.cardMode = "series";
  state.rangeStart = 1;
  state.rangeEnd = 5;
  state.configuredSeriesCount = 5;
  state.salesLoaded = false;
  state.soldUnits = [];
  state.salesDraftUnits = [];
  state.drawn = [];
  state.cards = [];
  state.prizeResults = [];
  state.pausedForWinner = false;
  state.pendingWinners = [];
  state.winnerViewIndex = 0;
  state.reviewingWinner = false;
  state.gameFinished = false;
  state.extraStartBallIndex = null;
  state.isGenerating = false;
  state.generationProgress = 0;
  state.isProjecting = false;
  state.recapShown = false;
  state.pozoVacancyShown = false;
  state.extraVacancyShown = false;
  state.visualSettings = createDefaultVisualSettings();
  state.stripDesign = loadPersistedStripDesign();
  state.projectionSettings = createDefaultProjectionSettings();
  state.prizeEnabled = {
    cuaterno: true,
    linea: true,
    segundaLinea: true,
    pozo: true,
    bingo: true,
    extra: true,
  };
  state.view = "home";
}

function openCreateEventDialog() {
  resetDraftForNewEvent();
  state.editingNewEvent = true;
  fillEventDialog({ blank: true });
  els.eventDialog.showModal();
}

function resetDraftForNewEvent() {
  state.eventId = createId();
  state.eventSeed = createId();
  state.eventCreated = false;
  state.eventName = "";
  state.eventDetail = "";
  state.combinationMode = "new";
  state.combinationSourceEventId = "";
  state.designMode = "new";
  state.designSourceEventId = "";
  state.cardMode = "series";
  state.rangeStart = 1;
  state.rangeEnd = 5;
  state.configuredSeriesCount = 5;
  state.salesLoaded = false;
  state.soldUnits = [];
  state.salesDraftUnits = [];
  state.drawn = [];
  state.cards = [];
  state.prizeResults = [];
  state.pausedForWinner = false;
  state.pendingWinners = [];
  state.winnerViewIndex = 0;
  state.reviewingWinner = false;
  state.gameFinished = false;
  state.extraStartBallIndex = null;
  state.isGenerating = false;
  state.generationProgress = 0;
  state.isProjecting = false;
  state.recapShown = false;
  state.pozoVacancyShown = false;
  state.extraVacancyShown = false;
  state.prizeEnabled = {
    cuaterno: true,
    linea: true,
    segundaLinea: true,
    pozo: true,
    bingo: true,
    extra: true,
  };
  state.prizeAmounts = {
    cuaterno: 0,
    linea: 0,
    segundaLinea: 0,
    bingo: 0,
    extra: 0,
  };
  state.prizeSettings = {
    pozoLimitBall: 37,
    pozoBaseLimitBall: 37,
    pozoLimitIncrement: 1,
    pozoPrize: 0,
    pozoBasePrize: 0,
    pozoPrizeIncrement: 0,
    extraBasePrize: 0,
    extraPrizeIncrement: 0,
    extraBalls: 5,
  };
  state.cardDesign = {
    title: "",
    accentColor: "#d1223b",
    backgroundColor: "#ffffff",
    footer: "",
  };
  state.visualSettings = createDefaultVisualSettings();
  state.stripDesign = loadPersistedStripDesign();
  state.projectionSettings = createDefaultProjectionSettings();
}

function drawRandomBall() {
  if (!state.eventCreated || !state.salesLoaded || !state.soldUnits.length || state.pausedForWinner || state.gameFinished || state.isProjecting) return;
  const available = [];
  for (let number = 1; number <= 90; number += 1) {
    if (!state.drawn.includes(number)) available.push(number);
  }
  const pick = available[Math.floor(Math.random() * available.length)];
  addBall(pick);
}

function addManualBall(number) {
  if (!state.eventCreated || !state.salesLoaded || !state.soldUnits.length || state.pausedForWinner || state.gameFinished || state.isProjecting) return;
  if (!Number.isInteger(number) || number < 1 || number > 90 || state.drawn.includes(number)) {
    els.manualBallInput.value = "";
    return;
  }
  addBall(number);
  els.manualBallInput.value = "";
}

function addBall(number) {
  state.drawn.push(number);
  const winners = state.isGenerating ? [] : detectPrizeResultsForCurrentBall();
  finishIfExtraWindowEnded({ delayMs: 850 });
  saveCurrentEvent({ silent: true });
  render();
  if (winners.length) {
    showWinnerDialog(winners, { delayMs: 850 });
  } else if (!state.isGenerating) {
    window.setTimeout(() => {
      if (!showPozoVacancyIfNeeded()) showRecapIfNeeded();
    }, 850);
  }
}

function undoLastBall() {
  state.drawn.pop();
  state.pausedForWinner = false;
  state.pendingWinners = [];
  state.winnerViewIndex = 0;
  state.reviewingWinner = false;
  state.gameFinished = false;
  state.extraStartBallIndex = null;
  state.recapShown = false;
  state.pozoVacancyShown = false;
  state.extraVacancyShown = false;
  rebuildPrizeResults();
  saveCurrentEvent({ silent: true });
  render();
}

function resetGame() {
  state.drawn = [];
  state.prizeResults = [];
  state.pausedForWinner = false;
  state.pendingWinners = [];
  state.winnerViewIndex = 0;
  state.reviewingWinner = false;
  state.gameFinished = false;
  state.extraStartBallIndex = null;
  state.recapShown = false;
  state.pozoVacancyShown = false;
  state.extraVacancyShown = false;
  saveCurrentEvent({ silent: true });
  render();
}

function fillEventDialog(options = {}) {
  state.visualSettings = normalizeVisualSettings(state.visualSettings);
  if (options.blank) activateEventTab("general");
  els.saveEventBtn.textContent = options.blank ? "Generar evento" : "Guardar cambios";
  els.eventNameInput.value = options.blank ? "" : state.eventName;
  els.eventDetailInput.value = options.blank ? "" : state.eventDetail;
  els.eventModeSeriesInput.checked = state.cardMode === "series";
  els.eventModeIndividualInput.checked = state.cardMode === "individual";
  els.eventRangeStartInput.value = state.rangeStart;
  els.eventRangeEndInput.value = state.rangeEnd;
  els.eventAccentColorInput.value = state.visualSettings.accentColor;
  els.eventPanelColorInput.value = state.visualSettings.panelColor;
  els.eventBallSizeInput.value = state.visualSettings.ballSize;
  els.eventButtonRadiusInput.value = state.visualSettings.buttonRadius;
  els.eventScreenMarginTopInput.value = state.visualSettings.screenMarginTop;
  els.eventScreenMarginBottomInput.value = state.visualSettings.screenMarginBottom;
  els.eventScreenMarginLeftInput.value = state.visualSettings.screenMarginLeft;
  els.eventScreenMarginRightInput.value = state.visualSettings.screenMarginRight;
  els.eventBingoLogoStatus.textContent = state.visualSettings.bingoLogoName
    ? `Logo cargado: ${state.visualSettings.bingoLogoName}`
    : "Sin logo cargado.";
  els.eventBingoLogoSizeInput.value = state.visualSettings.bingoLogoSize;
  els.eventIndigoLogoStatus.textContent = state.visualSettings.indigoLogoName
    ? `Logo cargado: ${state.visualSettings.indigoLogoName}`
    : "Sin logo cargado.";
  els.eventIndigoLogoSizeInput.value = state.visualSettings.indigoLogoSize;
  els.eventBallImagesStatus.textContent = getBallImagesStatusText();
  els.eventBoardPanelWidthInput.value = state.visualSettings.boardPanelWidth;
  els.eventBoardFontFamilyInput.value = state.visualSettings.boardFontFamily;
  els.eventBoardFontSizeInput.value = state.visualSettings.boardFontSize;
  els.eventSideTitleSizeInput.value = state.visualSettings.sideTitleSize;
  els.eventSideTextSizeInput.value = state.visualSettings.sideTextSize;
  els.eventBoardButtonColorInput.value = state.visualSettings.boardButtonColor;
  els.eventBoardTextColorInput.value = state.visualSettings.boardTextColor;
  els.eventBoardDrawnColorInput.value = state.visualSettings.boardDrawnColor;
  els.eventBoardDrawnTextColorInput.value = state.visualSettings.boardDrawnTextColor;
  els.eventBoardMarkEffectInput.value = state.visualSettings.boardMarkEffect;
  els.eventBoardShadowInput.checked = !!state.visualSettings.boardShadow;
  els.eventBoardNumberShadowInput.checked = !!state.visualSettings.boardNumberShadow;
  els.eventBoardNeonInput.checked = !!state.visualSettings.boardNeon;
  els.eventPozoLimitInput.value = state.prizeSettings.pozoLimitBall;
  els.eventPozoBaseLimitInput.value = state.prizeSettings.pozoBaseLimitBall || state.prizeSettings.pozoLimitBall || 37;
  els.eventPozoLimitIncrementInput.value = state.prizeSettings.pozoLimitIncrement;
  setMoneyInput(els.eventCuaternoPrizeInput, state.prizeAmounts.cuaterno);
  els.eventCuaternoEnabledInput.checked = state.prizeEnabled.cuaterno;
  setMoneyInput(els.eventLineaPrizeInput, state.prizeAmounts.linea);
  els.eventLineaEnabledInput.checked = state.prizeEnabled.linea;
  setMoneyInput(els.eventSegundaLineaPrizeInput, state.prizeAmounts.segundaLinea);
  els.eventSegundaLineaEnabledInput.checked = state.prizeEnabled.segundaLinea;
  setMoneyInput(els.eventPozoPrizeInput, state.prizeSettings.pozoPrize);
  setMoneyInput(els.eventPozoBasePrizeInput, state.prizeSettings.pozoBasePrize ?? state.prizeSettings.pozoPrize);
  els.eventPozoEnabledInput.checked = state.prizeEnabled.pozo;
  setMoneyInput(els.eventPozoPrizeIncrementInput, state.prizeSettings.pozoPrizeIncrement);
  setMoneyInput(els.eventBingoPrizeInput, state.prizeAmounts.bingo);
  els.eventBingoEnabledInput.checked = state.prizeEnabled.bingo;
  setMoneyInput(els.eventExtraPrizeInput, state.prizeAmounts.extra);
  setMoneyInput(els.eventExtraBasePrizeInput, state.prizeSettings.extraBasePrize ?? state.prizeAmounts.extra);
  els.eventExtraEnabledInput.checked = state.prizeEnabled.extra;
  setMoneyInput(
    els.eventExtraPrizeIncrementInput,
    state.prizeSettings.extraPrizeIncrement || state.prizeSettings.extraBasePrize || state.prizeAmounts.extra || 0,
  );
  els.eventExtraBallsInput.value = state.prizeSettings.extraBalls;
  els.eventCardTitleInput.value = options.blank ? "" : state.cardDesign.title;
  els.eventCardAccentInput.value = state.cardDesign.accentColor;
  els.eventCardBgInput.value = state.cardDesign.backgroundColor;
  els.eventCardFooterInput.value = options.blank ? "" : state.cardDesign.footer;
  els.eventRecapLeadBallsInput.value = state.projectionSettings.recapLeadBalls;
  els.eventRecapSecondsInput.value = state.projectionSettings.recapSeconds;
  els.eventWinnerMediaSecondsInput.value = state.projectionSettings.winnerSeconds;
  els.eventHeaderFontFamilyInput.value = state.visualSettings.headerFontFamily;
  els.eventHeaderTitleSizeInput.value = state.visualSettings.headerTitleSize;
  els.eventHeaderTitleColorInput.value = state.visualSettings.headerTitleColor;
  els.eventHeaderPrizeFontFamilyInput.value = state.visualSettings.headerPrizeFontFamily;
  els.eventHeaderPrizeSizeInput.value = state.visualSettings.headerPrizeSize;
  els.eventHeaderPrizeColorInput.value = state.visualSettings.headerPrizeColor;
  els.eventPrizeFontFamilyInput.value = state.visualSettings.prizeFontFamily;
  els.eventPrizeNameSizeInput.value = state.visualSettings.prizeNameSize;
  els.eventPrizeNameColorInput.value = state.visualSettings.prizeNameColor;
  els.eventPrizeAmountSizeInput.value = state.visualSettings.prizeAmountSize;
  els.eventPrizeAmountColorInput.value = state.visualSettings.prizeAmountColor;
  els.eventPanelHeadingColorInput.value = state.visualSettings.panelHeadingColor;
  els.eventPanelTextColorInput.value = state.visualSettings.panelTextColor;
  els.eventProjectionFontFamilyInput.value = state.visualSettings.projectionFontFamily;
  els.eventProjectionTitleSizeInput.value = state.visualSettings.projectionTitleSize;
  els.eventProjectionTitleColorInput.value = state.visualSettings.projectionTitleColor;
  els.eventProjectionDetailColorInput.value = state.visualSettings.projectionDetailColor;
  renderMediaStatus();
  updateEstimatedCards();
}

function renderAnnouncementMediaControls() {
  els.eventPrizeMediaList.innerHTML = "";
  announcementDefinitions.forEach((announcement) => {
    const item = document.createElement("label");
    item.className = "media-config-item";
    item.innerHTML = `
      <strong>${announcement.label}</strong>
      <span>
        <input data-announcement-media="${announcement.id}" type="file" accept=".jpg,.jpeg,.png,.mp4,image/jpeg,image/png,video/mp4">
        <span class="file-status" data-announcement-status="${announcement.id}">Se usara la placa predeterminada del sistema.</span>
      </span>
    `;
    els.eventPrizeMediaList.appendChild(item);
  });
}

function applyEventSettings() {
  if (state.currentUser && state.salesLoaded) {
    window.alert("Este evento ya esta cerrado para edicion porque las ventas fueron activadas.");
    els.eventDialog.close();
    state.view = "user-events";
    render();
    return;
  }
  const nextMode = els.eventModeIndividualInput.checked ? "individual" : "series";
  const nextRange = normalizeRange(
    Number(els.eventRangeStartInput.value) || 1,
    Number(els.eventRangeEndInput.value) || 1,
  );
  const generationChanged = nextMode !== state.cardMode
    || nextRange.start !== state.rangeStart
    || nextRange.end !== state.rangeEnd
    || !state.eventCreated;

  state.eventName = els.eventNameInput.value.trim() || "Evento principal";
  state.eventDetail = els.eventDetailInput.value.trim();
  state.cardMode = nextMode;
  state.rangeStart = nextRange.start;
  state.rangeEnd = nextRange.end;
  state.configuredSeriesCount = getConfiguredUnitCount();
  state.visualSettings.accentColor = els.eventAccentColorInput.value;
  state.visualSettings.panelColor = els.eventPanelColorInput.value;
  state.visualSettings.ballSize = clamp(Number(els.eventBallSizeInput.value) || 74, 36, 96);
  state.visualSettings.buttonRadius = clamp(Number(els.eventButtonRadiusInput.value) || 8, 0, 24);
  readScreenLayoutSettingsFromForm();
  readBoardVisualSettingsFromForm();
  state.prizeSettings.pozoLimitBall = clamp(Number(els.eventPozoLimitInput.value) || 30, 30, 90);
  state.prizeSettings.pozoBaseLimitBall = clamp(Number(els.eventPozoBaseLimitInput.value) || state.prizeSettings.pozoLimitBall || 37, 30, 90);
  state.prizeSettings.pozoLimitIncrement = clamp(Number(els.eventPozoLimitIncrementInput.value) || 1, 1, 20);
  state.prizeAmounts.cuaterno = parseMoneyInput(els.eventCuaternoPrizeInput.value);
  state.prizeEnabled.cuaterno = els.eventCuaternoEnabledInput.checked;
  state.prizeAmounts.linea = parseMoneyInput(els.eventLineaPrizeInput.value);
  state.prizeEnabled.linea = els.eventLineaEnabledInput.checked;
  state.prizeAmounts.segundaLinea = parseMoneyInput(els.eventSegundaLineaPrizeInput.value);
  state.prizeEnabled.segundaLinea = els.eventSegundaLineaEnabledInput.checked;
  state.prizeSettings.pozoPrize = parseMoneyInput(els.eventPozoPrizeInput.value);
  state.prizeSettings.pozoBasePrize = parseMoneyInput(els.eventPozoBasePrizeInput.value) || state.prizeSettings.pozoPrize || 0;
  state.prizeEnabled.pozo = els.eventPozoEnabledInput.checked;
  state.prizeSettings.pozoPrizeIncrement = parseMoneyInput(els.eventPozoPrizeIncrementInput.value);
  state.prizeAmounts.bingo = parseMoneyInput(els.eventBingoPrizeInput.value);
  state.prizeEnabled.bingo = els.eventBingoEnabledInput.checked;
  state.prizeAmounts.extra = parseMoneyInput(els.eventExtraPrizeInput.value);
  state.prizeSettings.extraBasePrize = parseMoneyInput(els.eventExtraBasePrizeInput.value) || state.prizeAmounts.extra || 0;
  state.prizeEnabled.extra = els.eventExtraEnabledInput.checked;
  state.prizeSettings.extraPrizeIncrement = parseMoneyInput(els.eventExtraPrizeIncrementInput.value) || state.prizeSettings.extraBasePrize || 0;
  state.prizeSettings.extraBalls = clamp(Number(els.eventExtraBallsInput.value) || 1, 1, 90);
  state.cardDesign.title = els.eventCardTitleInput.value.trim();
  state.cardDesign.accentColor = els.eventCardAccentInput.value;
  state.cardDesign.backgroundColor = els.eventCardBgInput.value;
  state.cardDesign.footer = els.eventCardFooterInput.value.trim();
  state.projectionSettings.recapLeadBalls = clamp(Number(els.eventRecapLeadBallsInput.value) || 0, 0, 30);
  state.projectionSettings.recapSeconds = clamp(Number(els.eventRecapSecondsInput.value) || 1, 1, 120);
  state.projectionSettings.winnerSeconds = clamp(Number(els.eventWinnerMediaSecondsInput.value) || 1, 1, 120);
  readTypographySettingsFromForm();
  state.eventCreated = true;
  state.eventId = state.eventId || createId();
  state.pausedForWinner = false;
  state.pendingWinners = [];
  state.winnerViewIndex = 0;
  state.reviewingWinner = false;
  state.gameFinished = false;

  if (generationChanged) {
    state.salesLoaded = false;
    state.soldUnits = [];
    state.salesDraftUnits = [];
    generateConfiguredCards();
    showEventSettingsSavedFeedback();
    return;
  }

  rebuildPrizeResults();
  saveCurrentEvent({ silent: true });
  render();
  showEventSettingsSavedFeedback();
}

function showEventSettingsSavedFeedback() {
  const originalText = state.editingNewEvent ? "Generar evento" : "Guardar cambios";
  els.saveEventBtn.textContent = "Cambios guardados";
  els.saveEventBtn.classList.add("saved-feedback");
  setTimeout(() => {
    els.saveEventBtn.textContent = originalText;
    els.saveEventBtn.classList.remove("saved-feedback");
  }, 1300);
}

function updateEstimatedCards() {
  const range = normalizeRange(
    Number(els.eventRangeStartInput.value) || 1,
    Number(els.eventRangeEndInput.value) || 1,
  );
  const units = range.end - range.start + 1;
  const total = els.eventModeIndividualInput.checked ? units : units * SERIES_SIZE;
  els.eventCardsTotalInput.value = total;
}

function activateEventTab(tabName) {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === tabName);
  });
}

function openEventDialogIfNeeded() {
  if (!state.eventCreated) showHome();
}

function createNewEvent(name) {
  state.eventId = createId();
  state.eventCreated = true;
  state.eventName = name;
  state.salesLoaded = false;
  state.soldUnits = [];
  state.salesDraftUnits = [];
  state.drawn = [];
  state.cards = [];
  state.prizeResults = [];
  generateConfiguredCards();
  saveCurrentEvent();
}

function generateSeries(seriesCount) {
  const safeCount = Math.max(1, Math.min(200, Number(seriesCount) || 1));
  state.cardMode = "series";
  state.rangeStart = 1;
  state.rangeEnd = safeCount;
  state.configuredSeriesCount = safeCount;
  state.salesLoaded = false;
  state.soldUnits = [];
  state.salesDraftUnits = [];
  generateConfiguredCards();
}

function generateConfiguredCards(options = {}) {
  const range = normalizeRange(state.rangeStart, state.rangeEnd);
  state.eventCreated = true;
  state.rangeStart = range.start;
  state.rangeEnd = range.end;
  state.configuredSeriesCount = getConfiguredUnitCount();
  if (!options.preserveGame) state.drawn = [];
  state.cards = [];
  if (!options.preserveGame) {
    state.prizeResults = [];
    state.pausedForWinner = false;
    state.pendingWinners = [];
    state.winnerViewIndex = 0;
    state.gameFinished = false;
    state.extraStartBallIndex = null;
    state.recapShown = false;
    state.pozoVacancyShown = false;
    state.extraVacancyShown = false;
  }
  state.isGenerating = true;
  state.generationProgress = 0;
  saveCurrentEvent({ silent: true });
  render();
  const generationUnits = getGenerationUnits();
  let unitIndex = 0;
  const diversityTracker = createDiversityTracker();
  const unitTotal = generationUnits.length || 1;
  const batchSize = state.cardMode === "individual" ? 500 : 80;

  function generateBatch() {
    const batchEnd = Math.min(generationUnits.length, unitIndex + batchSize);
    for (; unitIndex < batchEnd; unitIndex += 1) {
      const unit = generationUnits[unitIndex];
      if (state.cardMode === "individual") {
        state.cards.push(createIndividualCard(unit, diversityTracker));
      } else {
        state.cards.push(...createSeries(String(unit), getFirstCardNumberForSeries(unit), diversityTracker));
      }
    }
    state.generationProgress = Math.min(100, Math.round((unitIndex / unitTotal) * 100));
    render();
    if (unitIndex < generationUnits.length) {
      setTimeout(generateBatch, 0);
      return;
    }
    state.isGenerating = false;
    state.generationProgress = 100;
    const newWinners = options.preserveGame && state.drawn.length
      ? rebuildPrizeResultsAndGetNewWinners()
      : [];
    saveCurrentEvent({ silent: true });
    render();
    if (newWinners.length) showWinnerDialog(newWinners);
  }

  generateBatch();
}

function createSeries(seriesNumber, firstCardNumber = 1, diversityTracker = null) {
  const attempts = diversityTracker ? 14 : 1;
  let bestCards = null;
  let bestScore = Infinity;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const random = createSeededRandom(`${state.eventSeed}:series:${seriesNumber}:v${attempt}`);
    const candidate = createSeriesCandidate(seriesNumber, firstCardNumber, random);
    const score = diversityTracker ? scoreCardsDiversity(candidate, diversityTracker) : 0;
    if (score < bestScore) {
      bestCards = candidate;
      bestScore = score;
    }
    if (score === 0) break;
  }
  if (diversityTracker) registerCardsDiversity(bestCards, diversityTracker);
  return bestCards;
}

function createSeriesCandidate(seriesNumber, firstCardNumber, random) {
  const pattern = createSeriesPattern(random);
  const columns = Array.from({ length: 9 }, (_, column) => {
    const start = column * 10 + 1;
    const end = start + 9;
    return shuffle(range(start, end), random);
  });
  const cards = [];

  for (let cardIndex = 0; cardIndex < SERIES_SIZE; cardIndex += 1) {
    const rows = Array.from({ length: 3 }, (_, rowIndex) => {
      const sourceRow = pattern[cardIndex * 3 + rowIndex];
      return sourceRow.map((hasNumber, column) => (hasNumber ? columns[column].shift() : null));
    });
    cards.push({
      id: `${state.eventSeed}-series-${seriesNumber}-${cardIndex + 1}`,
      mode: "series",
      series: seriesNumber,
      cardNumber: firstCardNumber + cardIndex,
      cardPositionInSeries: cardIndex + 1,
      rows,
    });
  }

  return cards;
}

function createIndividualCard(cardNumber, diversityTracker = null) {
  const attempts = diversityTracker ? 10 : 1;
  let bestCard = null;
  let bestScore = Infinity;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const random = createSeededRandom(`${state.eventSeed}:individual:${cardNumber}:v${attempt}`);
    const candidate = {
      id: `${state.eventSeed}-individual-${cardNumber}`,
      mode: "individual",
      series: null,
      cardNumber,
      rows: createSingleCardRows(random),
    };
    const score = diversityTracker ? scoreCardsDiversity([candidate], diversityTracker) : 0;
    if (score < bestScore) {
      bestCard = candidate;
      bestScore = score;
    }
    if (score === 0) break;
  }
  if (diversityTracker) registerCardsDiversity([bestCard], diversityTracker);
  return bestCard;
}

function createDiversityTracker() {
  return {
    lineKeys: new Set(),
    cuaternoKeys: new Set(),
    shapeCounts: new Map(),
  };
}

function scoreCardsDiversity(cards, tracker) {
  let score = 0;
  const localLines = new Set();
  const localCuaternos = new Set();
  const localShapes = new Map();
  cards.forEach((card) => {
    getCardDiversitySignatures(card).forEach((signature) => {
      if (tracker.lineKeys.has(signature.lineKey)) score += 1200;
      if (localLines.has(signature.lineKey)) score += 1200;
      localLines.add(signature.lineKey);

      signature.cuaternoKeys.forEach((key) => {
        if (tracker.cuaternoKeys.has(key)) score += 140;
        if (localCuaternos.has(key)) score += 140;
        localCuaternos.add(key);
      });

      const previousShapeCount = tracker.shapeCounts.get(signature.shapeKey) || 0;
      const localShapeCount = localShapes.get(signature.shapeKey) || 0;
      score += previousShapeCount * 6 + localShapeCount * 10;
      localShapes.set(signature.shapeKey, localShapeCount + 1);
    });
  });
  return score;
}

function registerCardsDiversity(cards, tracker) {
  cards.forEach((card) => {
    getCardDiversitySignatures(card).forEach((signature) => {
      tracker.lineKeys.add(signature.lineKey);
      signature.cuaternoKeys.forEach((key) => tracker.cuaternoKeys.add(key));
      tracker.shapeCounts.set(signature.shapeKey, (tracker.shapeCounts.get(signature.shapeKey) || 0) + 1);
    });
  });
}

function getCardDiversitySignatures(card) {
  return card.rows.map((row) => {
    const numbers = row.filter((number) => number !== null).sort((a, b) => a - b);
    return {
      lineKey: numbers.join("-"),
      cuaternoKeys: getCombinations(numbers, 4).map((combination) => combination.join("-")),
      shapeKey: row.map((number, index) => (number === null ? "" : index)).filter((value) => value !== "").join("-"),
    };
  });
}

function getCombinations(values, size) {
  const results = [];
  function visit(start, combination) {
    if (combination.length === size) {
      results.push([...combination]);
      return;
    }
    for (let index = start; index <= values.length - (size - combination.length); index += 1) {
      combination.push(values[index]);
      visit(index + 1, combination);
      combination.pop();
    }
  }
  visit(0, []);
  return results;
}

function createSingleCardRows(random) {
  const rows = Array.from({ length: 3 }, () => Array(9).fill(null));
  const used = new Set();
  for (let rowIndex = 0; rowIndex < 3; rowIndex += 1) {
    const columns = shuffle(range(0, 8), random).slice(0, 5).sort((a, b) => a - b);
    columns.forEach((column) => {
      const start = column * 10 + 1;
      const end = start + 9;
      const options = range(start, end).filter((number) => !used.has(number));
      const number = shuffle(options, random)[0];
      used.add(number);
      rows[rowIndex][column] = number;
    });
  }
  return rows;
}

function createSeriesPattern(random) {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const columnQuotas = Array(9).fill(10);
    const rows = [];
    let failed = false;

    for (let rowIndex = 0; rowIndex < 18; rowIndex += 1) {
      const row = Array(9).fill(false);
      const rowsLeftAfter = 17 - rowIndex;
      const requiredColumns = range(0, 8).filter((column) => columnQuotas[column] > rowsLeftAfter);

      if (requiredColumns.length > 5) {
        failed = true;
        break;
      }

      requiredColumns.forEach((column) => {
        row[column] = true;
        columnQuotas[column] -= 1;
      });

      while (row.filter(Boolean).length < 5) {
        const candidates = range(0, 8).filter((column) => !row[column] && columnQuotas[column] > 0);
        if (!candidates.length) {
          failed = true;
          break;
        }
        const column = weightedPick(candidates, columnQuotas, random);
        row[column] = true;
        columnQuotas[column] -= 1;
      }

      if (failed) break;
      rows.push(row);
    }

    if (!failed && columnQuotas.every((quota) => quota === 0)) return rows;
  }

  return createFallbackSeriesPattern();
}

function createFallbackSeriesPattern() {
  return Array.from({ length: 18 }, (_, rowIndex) => {
    const row = Array(9).fill(false);
    for (let offset = 0; offset < 5; offset += 1) {
      row[(rowIndex * 5 + offset) % 9] = true;
    }
    return row;
  });
}

function detectPrizeResultsForCurrentBall() {
  const currentBall = state.drawn.at(-1);
  if (!currentBall) return [];

  const currentSet = new Set(state.drawn);
  const previousSet = new Set(state.drawn.slice(0, -1));
  const prize = getCurrentPrize();
  if (!prize) return [];
  const winners = [];
  getPlayableCards().forEach((card) => {
    const matches = getNewPrizeMatches(card, prize, currentSet, previousSet);
    matches.forEach((match) => winners.push({ card, match }));
  });
  const results = winners.map(({ card, match }) => toWinner(prize, card, match, currentBall));
  state.prizeResults.push(...results);
  if ((prize.id === "pozo" || prize.id === "bingo") && results.length) {
    state.extraStartBallIndex = state.drawn.length;
  }
  return results;
}

function showWinnerDialog(winners, options = {}) {
  state.pausedForWinner = true;
  state.pendingWinners = winners;
  state.winnerViewIndex = 0;
  state.reviewingWinner = false;
  renderWinnerDialogCurrent();
  render();
  window.setTimeout(() => {
    showAnnouncement(winners[0].prizeId, openWinnerDialog);
  }, options.delayMs || 0);
}

function openWinnerDialog() {
  if (!els.winnerDialog.open) els.winnerDialog.showModal();
}

function showRecapIfNeeded() {
  const { recapLeadBalls, recapSeconds, recapMediaKey } = state.projectionSettings;
  const recapBall = Math.max(1, state.prizeSettings.pozoLimitBall - recapLeadBalls);
  if (!state.prizeEnabled.pozo || isPrizeClosed("pozo") || state.recapShown || state.drawn.length !== recapBall) return;
  state.recapShown = true;
  saveCurrentEvent({ silent: true });
  showProjection({
    title: "Es hora de repasar",
    seconds: recapSeconds,
    mediaKey: recapMediaKey,
    useDefault: true,
  });
}

function showPozoVacancyIfNeeded() {
  if (!state.prizeEnabled.pozo || state.pozoVacancyShown || isPrizeClosed("pozo")) return false;
  if (!arePrePozoPrizesClosed()) return false;
  if (state.drawn.length < state.prizeSettings.pozoLimitBall) return false;
  state.pozoVacancyShown = true;
  saveCurrentEvent({ silent: true });
  showAnnouncement("pozo-vacante");
  return true;
}

function arePrePozoPrizesClosed() {
  return (!state.prizeEnabled.cuaterno || isPrizeClosed("cuaterno"))
    && (!state.prizeEnabled.linea || isPrizeClosed("linea"))
    && (!state.prizeEnabled.segundaLinea || isPrizeClosed("segunda-linea"));
}

function showAnnouncement(announcementId, onFinish) {
  const announcement = getAnnouncementDefinition(announcementId);
  const media = getAnnouncementMedia(announcementId);
  showProjection({
    title: announcement?.title || "Premio",
    seconds: state.projectionSettings.winnerSeconds,
    mediaKey: media.mediaKey,
    useDefault: true,
    onFinish,
  });
}

function renderWinnerDialogCurrent() {
  const winner = state.pendingWinners[state.winnerViewIndex];
  if (!winner) return;
  const card = state.cards.find((item) => item.id === winner.cardId);
  if (!card) return;

  els.winnerCardTitle.textContent = `Carton ${winner.cardNumber}`;
  els.winnerCardSubtitle.textContent = winner.mode === "individual"
    ? "Carton individual"
    : `Serie ${winner.series}`;
  els.winnerPrizeTitle.textContent = `Carton ganador con ${winner.prize}`;
  els.winnerCountText.textContent = state.pendingWinners.length === 1
    ? "1 carton ganador"
    : `${state.pendingWinners.length} cartones ganadores`;
  els.winnerPositionText.textContent = `${state.winnerViewIndex + 1} de ${state.pendingWinners.length}`;
  els.winnerPrevBtn.disabled = state.pendingWinners.length <= 1;
  els.winnerNextBtn.disabled = state.pendingWinners.length <= 1;
  els.winnerContinueBtn.textContent = state.reviewingWinner ? "Cerrar" : "Continuar juego";
  renderWinnerCard(card, winner);
}

function changeWinnerView(direction) {
  if (!state.pendingWinners.length) return;
  state.winnerViewIndex = (state.winnerViewIndex + direction + state.pendingWinners.length) % state.pendingWinners.length;
  renderWinnerDialogCurrent();
}

function renderWinnerCard(card, winner) {
  const drawnSet = new Set(state.drawn);
  const winningNumbers = getWinningNumbers(card, winner);
  els.winnerCardPreview.innerHTML = "";
  card.rows.forEach((row, rowIndex) => {
    const rowEl = document.createElement("div");
    rowEl.className = "winner-card-row";
    row.forEach((number) => {
      const cell = document.createElement("span");
      cell.className = number ? "winner-card-number" : "winner-card-empty";
      if (number) {
        cell.textContent = number;
        cell.classList.toggle("marked", drawnSet.has(number));
        cell.classList.toggle("winning", winningNumbers.has(number));
        cell.classList.toggle("row-win", winner.rowNumber === rowIndex + 1);
      }
      rowEl.appendChild(cell);
    });
    els.winnerCardPreview.appendChild(rowEl);
  });
}

function getWinningNumbers(card, winner) {
  if (!winner.rowNumber) return new Set(card.rows.flat().filter((number) => number && state.drawn.includes(number)));
  const row = card.rows[winner.rowNumber - 1] || [];
  return new Set(row.filter((number) => number && state.drawn.includes(number)));
}

let projectionTimeoutId = null;
let projectionCountdownId = null;
let activeProjectionUrl = "";

async function showProjection({ title, seconds, mediaKey, useDefault = false, onFinish }) {
  closeProjection();
  state.isProjecting = true;
  render();
  els.projectionTitle.textContent = title;
  renderDefaultProjection(title);
  els.projectionImage.classList.add("hidden");
  els.projectionVideo.classList.add("hidden");
  els.projectionDefault.classList.toggle("hidden", !useDefault);
  let mediaFile = null;
  if (mediaKey) {
    try {
      mediaFile = await loadMediaFile(mediaKey);
    } catch {
      mediaFile = null;
    }
  }
  if (mediaKey && !mediaFile && !useDefault) {
    state.isProjecting = false;
    render();
    if (onFinish) onFinish();
    return;
  }
  if (mediaFile) {
    activeProjectionUrl = URL.createObjectURL(mediaFile);
    els.projectionDefault.classList.add("hidden");
    if (mediaFile.type === "video/mp4") {
      els.projectionVideo.src = activeProjectionUrl;
      els.projectionVideo.classList.remove("hidden");
      els.projectionVideo.play().catch(() => {});
    } else {
      els.projectionImage.src = activeProjectionUrl;
      els.projectionImage.alt = title;
      els.projectionImage.classList.remove("hidden");
    }
  }
  if (!els.projectionDialog.open) els.projectionDialog.showModal();
  const totalSeconds = clamp(Number(seconds) || 1, 1, 120);
  let remaining = totalSeconds;
  els.projectionCountdown.textContent = `${remaining} s`;
  projectionCountdownId = setInterval(() => {
    remaining -= 1;
    els.projectionCountdown.textContent = `${Math.max(0, remaining)} s`;
  }, 1000);
  projectionTimeoutId = setTimeout(() => {
    closeProjection();
    if (onFinish) onFinish();
  }, totalSeconds * 1000);
}

function renderDefaultProjection(title) {
  els.projectionDefault.innerHTML = "";
  const eyebrow = document.createElement("span");
  eyebrow.textContent = title.toLowerCase().includes("vacante") ? "Sin ganador" : "Sistema de Bingo 90";
  const heading = document.createElement("strong");
  heading.textContent = title;
  const detail = document.createElement("p");
  detail.textContent = title === "Es hora de repasar"
    ? "Revisamos las bolillas cantadas antes de continuar."
    : "Anuncio de la jugada actual.";
  els.projectionDefault.append(eyebrow, heading, detail);
}

function closeProjection() {
  clearTimeout(projectionTimeoutId);
  clearInterval(projectionCountdownId);
  projectionTimeoutId = null;
  projectionCountdownId = null;
  els.projectionVideo.pause();
  els.projectionVideo.removeAttribute("src");
  els.projectionImage.removeAttribute("src");
  if (activeProjectionUrl) URL.revokeObjectURL(activeProjectionUrl);
  activeProjectionUrl = "";
  if (els.projectionDialog.open) els.projectionDialog.close();
  state.isProjecting = false;
  render();
}

function continueAfterWinner() {
  if (state.reviewingWinner) {
    state.reviewingWinner = false;
    state.pendingWinners = [];
    state.winnerViewIndex = 0;
    if (els.winnerDialog.open) els.winnerDialog.close();
    render();
    return;
  }
  const hadExtraWinner = state.pendingWinners.some((winner) => winner.prizeId === "extra");
  const hadMainWinner = state.pendingWinners.some((winner) => winner.prizeId === "pozo" || winner.prizeId === "bingo");
  const hadPrePozoWinner = state.pendingWinners.some((winner) => ["cuaterno", "linea", "segunda-linea"].includes(winner.prizeId));
  state.pausedForWinner = false;
  state.pendingWinners = [];
  state.winnerViewIndex = 0;
  state.reviewingWinner = false;
  if (hadExtraWinner || (hadMainWinner && !state.prizeEnabled.extra)) state.gameFinished = true;
  if (els.winnerDialog.open) els.winnerDialog.close();
  if (hadPrePozoWinner) showPozoVacancyIfNeeded();
  saveCurrentEvent({ silent: true });
  render();
}

function rebuildPrizeResults() {
  const drawn = [...state.drawn];
  state.prizeResults = [];
  state.pausedForWinner = false;
  state.pendingWinners = [];
  state.winnerViewIndex = 0;
  state.gameFinished = false;
  state.extraStartBallIndex = null;
  state.recapShown = false;
  state.pozoVacancyShown = false;
  state.extraVacancyShown = false;
  state.drawn = [];
  drawn.forEach((number) => {
    state.drawn.push(number);
    detectPrizeResultsForCurrentBall();
  });
}

function rebuildPrizeResultsAndGetNewWinners() {
  const previousKeys = new Set(state.prizeResults.map(getWinnerKey));
  rebuildPrizeResults();
  return state.prizeResults.filter((winner) => !previousKeys.has(getWinnerKey(winner)));
}

function getWinnerKey(winner) {
  return [
    winner.prizeId,
    winner.cardId,
    winner.rowNumber || "",
    winner.ballIndex,
  ].join("|");
}

function getCurrentPrize() {
  if (state.gameFinished) return null;
  if (state.prizeEnabled.cuaterno && !isPrizeClosed("cuaterno")) return getPrizeDefinition("cuaterno");
  if (state.prizeEnabled.linea && !isPrizeClosed("linea")) return getPrizeDefinition("linea");
  if (state.prizeEnabled.segundaLinea && !isPrizeClosed("segunda-linea")) return getPrizeDefinition("segunda-linea");
  if (state.prizeEnabled.pozo && !isPrizeClosed("pozo") && state.drawn.length <= state.prizeSettings.pozoLimitBall) {
    return getPrizeDefinition("pozo");
  }
  if (state.prizeEnabled.bingo && !isPrizeClosed("bingo") && !isPrizeClosed("pozo")) return getPrizeDefinition("bingo");
  if (state.prizeEnabled.extra && !isPrizeClosed("extra") && hasMainFullCardPrize()) {
    return isExtraWindowOpen() ? getPrizeDefinition("extra") : null;
  }
  return null;
}

function hasMainFullCardPrize() {
  return isPrizeClosed("pozo") || isPrizeClosed("bingo") || (!state.prizeEnabled.pozo && !state.prizeEnabled.bingo);
}

function getExtraStartBallIndex() {
  return state.extraStartBallIndex;
}

function isExtraWindowOpen() {
  const start = getExtraStartBallIndex();
  return start !== null && state.drawn.length <= start + state.prizeSettings.extraBalls;
}

function finishIfExtraWindowEnded(options = {}) {
  if (!state.prizeEnabled.extra || isPrizeClosed("extra") || state.extraStartBallIndex === null) return;
  if (state.drawn.length >= state.extraStartBallIndex + state.prizeSettings.extraBalls && !state.pausedForWinner) {
    if (!state.extraVacancyShown) {
      state.extraVacancyShown = true;
      window.setTimeout(() => showAnnouncement("extra-vacante"), options.delayMs || 0);
    }
    state.gameFinished = true;
  }
}

function getPrizeDefinition(prizeId) {
  return prizeDefinitions.find((prize) => prize.id === prizeId);
}

function getNewPrizeMatches(card, prize, currentSet, previousSet) {
  const current = getCardProgress(card, currentSet);
  const previous = getCardProgress(card, previousSet);
  if (prize.count) {
    return current.rowProgress.filter((row, index) => {
      return row.markedCount >= prize.count && previous.rowProgress[index].markedCount < prize.count;
    });
  }
  if (prize.id === "linea") {
    return current.rowProgress.filter((row, index) => row.complete && !previous.rowProgress[index].complete);
  }
  if (prize.id === "segunda-linea") {
    const currentCompleteRows = current.rowProgress.filter((row) => row.complete);
    const previousCompleteRows = previous.rowProgress.filter((row) => row.complete);
    if (currentCompleteRows.length >= 2 && previousCompleteRows.length < 2) {
      const newlyCompleted = currentCompleteRows.find((row) => {
        return !previous.rowProgress[row.rowNumber - 1].complete;
      });
      return newlyCompleted ? [newlyCompleted] : [currentCompleteRows[1]];
    }
    return [];
  }
  if (prize.id === "bingo" || prize.id === "pozo" || prize.id === "extra") {
    if (current.bingo && !previous.bingo) {
      return [{ rowNumber: null, rowMarkedCount: 5, markedCount: current.markedCount }];
    }
    return [];
  }
  return [];
}

function getCardProgress(card, drawnSet) {
  const rowProgress = card.rows.map((row, index) => {
    const numbers = row.filter(Boolean);
    const markedCount = numbers.filter((number) => drawnSet.has(number)).length;
    return {
      rowNumber: index + 1,
      rowMarkedCount: markedCount,
      markedCount,
      complete: numbers.length === 5 && markedCount === 5,
    };
  });
  const lines = rowProgress.filter((row) => row.complete).length;
  const cardNumbers = card.rows.flat().filter(Boolean);
  const markedCount = cardNumbers.filter((number) => drawnSet.has(number)).length;
  return {
    lines,
    markedCount,
    rowProgress,
    bingo: markedCount === NUMBERS_PER_CARD,
  };
}

function isPrizeClosed(prizeId) {
  return state.prizeResults.some((winner) => winner.prizeId === prizeId);
}

function toWinner(prize, card, match, ball) {
  const winningNumbers = match.rowNumber
    ? card.rows[match.rowNumber - 1].filter((number) => number && state.drawn.includes(number))
    : card.rows.flat().filter((number) => number && state.drawn.includes(number));
  return {
    prize: prize.label,
    prizeId: prize.id,
    cardId: card.id,
    mode: card.mode,
    series: card.series,
    cardNumber: card.cardNumber,
    rowNumber: match.rowNumber,
    rowMarkedCount: match.rowMarkedCount,
    markedCount: match.markedCount,
    winningNumbers,
    ball,
    ballIndex: state.drawn.length,
  };
}

function saveCurrentEvent(options = {}) {
  if (!state.eventCreated) {
    renderSavedEvents();
    renderHomeSavedEvents();
    return null;
  }
  state.prizeSettings = normalizePrizeSettings(state.prizeSettings);
  const events = loadSavedEvents();
  const payload = buildCurrentEventPayload();
  const nextEvents = [payload, ...events.filter((event) => event.id !== state.eventId)].slice(0, 30);
  saveEventsToLocalStorage(nextEvents);
  scheduleServerStateSave();
  if (!options.skipCargasSave) saveCargasBingoPanelSettings(payload);
  renderSavedEvents();
  renderHomeSavedEvents();
  if (options.manual && state.gameFinished && options.prepareNext !== false) {
    prepareNextDrawAfterFinished();
    saveCurrentEvent({ silent: true, prepareNext: false });
    render();
    window.alert("Partida guardada. El sorteo quedo preparado para la proxima jugada.");
  }
  return payload;
}

function buildCurrentEventPayload() {
  return {
    id: state.eventId,
    name: state.eventName,
    eventCreated: state.eventCreated,
    eventSeed: state.eventSeed,
    eventDetail: state.eventDetail,
    combinationMode: state.combinationMode || "new",
    combinationSourceEventId: state.combinationSourceEventId || "",
    designMode: state.designMode || "new",
    designSourceEventId: state.designSourceEventId || "",
    cardMode: state.cardMode,
    rangeStart: state.rangeStart,
    rangeEnd: state.rangeEnd,
    configuredSeriesCount: state.configuredSeriesCount,
    salesLoaded: state.salesLoaded,
    soldUnits: state.soldUnits,
    salesDraftUnits: getSalesDraftUnits(),
    completedGames: state.completedGames || [],
    savedAt: new Date().toISOString(),
    drawn: state.drawn,
    prizeResults: state.prizeResults,
    pausedForWinner: state.pausedForWinner,
    pendingWinners: state.pendingWinners,
    gameFinished: state.gameFinished,
    extraStartBallIndex: state.extraStartBallIndex,
    recapShown: state.recapShown,
    pozoVacancyShown: state.pozoVacancyShown,
    extraVacancyShown: state.extraVacancyShown,
    prizeEnabled: state.prizeEnabled,
    prizeAmounts: state.prizeAmounts,
    prizeSettings: state.prizeSettings,
    cardDesign: state.cardDesign,
    visualSettings: state.visualSettings,
    stripDesign: state.stripDesign,
    projectionSettings: state.projectionSettings,
    stats: getStats(),
  };
}

async function ensureCargasPanelSaved() {
  if (!isLaunchedFromCargas() || optionsSavingToCargasDisabled()) return true;
  if (!state.eventCreated) return false;
  const savedEvent = saveCurrentEvent({ silent: true, prepareNext: false, skipCargasSave: true });
  if (!savedEvent) return false;
  try {
    await saveCargasBingoPanelSettings(savedEvent, { throwOnError: true, timeoutMs: 60000 });
    return true;
  } catch {
    return false;
  }
}

function saveCargasBingoPanelSettings(eventPayload, options = {}) {
  if (!isLaunchedFromCargas() || optionsSavingToCargasDisabled()) return Promise.resolve(true);
  if (!eventPayload?.id) return Promise.resolve(false);
  const panel = {
    id: eventPayload.id,
    name: eventPayload.name,
    eventSeed: eventPayload.eventSeed,
    eventDetail: eventPayload.eventDetail,
    combinationMode: eventPayload.combinationMode,
    combinationSourceEventId: eventPayload.combinationSourceEventId,
    designMode: eventPayload.designMode,
    designSourceEventId: eventPayload.designSourceEventId,
    cardMode: eventPayload.cardMode,
    rangeStart: eventPayload.rangeStart,
    rangeEnd: eventPayload.rangeEnd,
    configuredSeriesCount: eventPayload.configuredSeriesCount,
    completedGames: eventPayload.completedGames,
    drawn: eventPayload.drawn,
    prizeResults: eventPayload.prizeResults,
    pausedForWinner: eventPayload.pausedForWinner,
    pendingWinners: eventPayload.pendingWinners,
    gameFinished: eventPayload.gameFinished,
    extraStartBallIndex: eventPayload.extraStartBallIndex,
    recapShown: eventPayload.recapShown,
    pozoVacancyShown: eventPayload.pozoVacancyShown,
    extraVacancyShown: eventPayload.extraVacancyShown,
    prizeEnabled: eventPayload.prizeEnabled,
    prizeAmounts: eventPayload.prizeAmounts,
    prizeSettings: eventPayload.prizeSettings,
    cardDesign: eventPayload.cardDesign,
    visualSettings: eventPayload.visualSettings,
    stripDesign: eventPayload.stripDesign,
    projectionSettings: eventPayload.projectionSettings,
    stats: eventPayload.stats,
    savedAt: eventPayload.savedAt,
  };
  return fetchWithTimeout("/api/bingo-panel", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ eventId: eventPayload.id, panel }),
  }, options.timeoutMs || 60000).then(async (response) => {
    if (!response.ok) {
      const detail = await readErrorResponse(response);
      const error = new Error(detail || "Cargas no confirmo el guardado del diseno.");
      error.status = response.status;
      throw error;
    }
    return true;
  }).catch((error) => {
    if (options.throwOnError) throw error;
    return false;
  });
}

async function readErrorResponse(response) {
  const fallback = `Error ${response.status}`;
  try {
    const text = await response.text();
    if (!text) return fallback;
    try {
      const parsed = JSON.parse(text);
      return parsed.error || parsed.message || fallback;
    } catch {
      return text.slice(0, 240);
    }
  } catch {
    return fallback;
  }
}

function describeCargasPanelSaveError(error) {
  if (!error) return "No llego una respuesta valida del servidor.";
  if (error.name === "AbortError") return "El servidor tardo demasiado en responder. Puede pasar si el diseno tiene imagenes muy pesadas.";
  if (error.status === 401) return "La sesion de Cargas esta vencida. Inicia sesion otra vez y reintenta.";
  if (error.status === 403) return "Tu usuario no tiene permiso para guardar el panel de este evento.";
  if (error.status === 404) return "Cargas no encontro este evento. Volve a abrirlo desde el listado de eventos confirmados.";
  return error.message || "No llego una respuesta valida del servidor.";
}

function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => window.clearTimeout(timer));
}

function optionsSavingToCargasDisabled() {
  return location.protocol !== "http:" && location.protocol !== "https:";
}

function exportEventReport() {
  if (!state.eventCreated || !state.gameFinished) return;
  saveCurrentEvent({ silent: true, prepareNext: false });
  const reportWindow = window.open("", "_blank");
  if (!reportWindow) {
    window.alert("El navegador bloqueo la ventana del reporte. Habilita ventanas emergentes para guardar el PDF.");
    return;
  }
  reportWindow.document.write(buildReportHtml());
  reportWindow.document.close();
}

function prepareNextDrawAfterFinished() {
  const pozoWon = isPrizeClosed("pozo");
  const extraWon = isPrizeClosed("extra");
  const extraVacant = state.prizeEnabled.extra && state.extraStartBallIndex !== null && !extraWon;
  const completedSnapshot = {
    savedAt: new Date().toISOString(),
    drawn: [...state.drawn],
    prizeResults: [...state.prizeResults],
    pozoWon,
    pozoVacant: state.prizeEnabled.pozo && !pozoWon,
    extraWon,
    extraVacant,
    pozoLimitBall: state.prizeSettings.pozoLimitBall,
    pozoPrize: state.prizeSettings.pozoPrize,
    extraPrize: state.prizeAmounts.extra,
  };
  state.completedGames = [completedSnapshot, ...(state.completedGames || [])].slice(0, 20);

  if (state.prizeEnabled.pozo) {
    const baseLimit = clamp(Number(state.prizeSettings.pozoBaseLimitBall) || state.prizeSettings.pozoLimitBall || 37, 30, 90);
    const basePrize = Math.max(0, Number(state.prizeSettings.pozoBasePrize) || 0);
    if (pozoWon) {
      state.prizeSettings.pozoLimitBall = baseLimit;
      state.prizeSettings.pozoPrize = basePrize;
    } else {
      const limitIncrement = clamp(Number(state.prizeSettings.pozoLimitIncrement) || 1, 1, 20);
      const prizeIncrement = Math.max(0, Number(state.prizeSettings.pozoPrizeIncrement) || 0);
      state.prizeSettings.pozoLimitBall = clamp(state.prizeSettings.pozoLimitBall + limitIncrement, 30, 90);
      state.prizeSettings.pozoPrize = Math.max(0, Number(state.prizeSettings.pozoPrize) || 0) + prizeIncrement;
    }
  }

  if (state.prizeEnabled.extra) {
    const baseExtraPrize = Math.max(0, Number(state.prizeSettings.extraBasePrize) || 0);
    const extraIncrement = Math.max(0, Number(state.prizeSettings.extraPrizeIncrement) || baseExtraPrize || 0);
    if (extraWon) {
      state.prizeAmounts.extra = baseExtraPrize;
    } else if (extraVacant) {
      state.prizeAmounts.extra = Math.max(0, Number(state.prizeAmounts.extra) || 0) + extraIncrement;
    }
  }

  resetDrawStateForNextGame();
}

function resetDrawStateForNextGame() {
  state.drawn = [];
  state.prizeResults = [];
  state.pausedForWinner = false;
  state.pendingWinners = [];
  state.winnerViewIndex = 0;
  state.reviewingWinner = false;
  state.gameFinished = false;
  state.extraStartBallIndex = null;
  state.recapShown = false;
  state.pozoVacancyShown = false;
  state.extraVacancyShown = false;
  state.isProjecting = false;
}

function buildReportHtml() {
  const winnersHtml = state.prizeResults.map((winner, index) => {
    const card = state.cards.find((item) => item.id === winner.cardId);
    const numbers = new Set(winner.winningNumbers || []);
    const cardHtml = card ? card.rows.map((row) => `
      <div class="report-card-row">
        ${row.map((number) => `<span class="${number && numbers.has(number) ? "hit" : ""}">${number || ""}</span>`).join("")}
      </div>
    `).join("") : "";
    return `
      <section class="report-winner">
        <h3>${index + 1}. ${escapeHtml(winner.prize)}</h3>
        <p>${winner.mode === "individual" ? "Carton individual" : `Serie N° ${escapeHtml(winner.series)}`} - Carton N° ${winner.cardNumber}${winner.rowNumber ? ` - Fila N° ${winner.rowNumber}` : ""}</p>
        <p>Bolilla ultima del premio: ${winner.ball} (${winner.ballIndex}° cantada)</p>
        <div class="report-card">${cardHtml}</div>
      </section>
    `;
  }).join("");
  return `<!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Reporte - ${escapeHtml(state.eventName)}</title>
        <style>
          body{font-family:Arial,sans-serif;margin:28px;color:#111}h1,h2,h3{margin:0 0 10px}
          p{margin:5px 0}.actions{margin-bottom:18px}.balls{line-height:1.9}.ball{display:inline-block;border:1px solid #999;border-radius:4px;margin:2px;padding:2px 6px}
          .report-winner{break-inside:avoid;border-top:2px solid #222;margin-top:18px;padding-top:12px}.report-card{display:grid;gap:3px;max-width:620px;margin-top:10px}
          .report-card-row{display:grid;grid-template-columns:repeat(9,1fr);gap:3px}.report-card span{display:grid;place-items:center;min-height:34px;border:1px solid #777;font-weight:700}
          .report-card .hit{background:#fff000}@media print{.actions{display:none}}
        </style>
      </head>
      <body>
        <div class="actions"><button onclick="window.print()">Imprimir / Guardar como PDF</button></div>
        <h1>${escapeHtml(state.eventName)}</h1>
        <p>${escapeHtml(state.eventDetail || "Reporte final de jugada")}</p>
        <p>Fecha del reporte: ${new Date().toLocaleString("es-AR")}</p>
        <h2>Orden de bolillas</h2>
        <div class="balls">${state.drawn.map((ball, index) => `<span class="ball">${index + 1}. ${ball}</span>`).join("")}</div>
        <h2>Premios y cartones ganadores</h2>
        ${winnersHtml || "<p>No se registraron ganadores.</p>"}
      </body>
    </html>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadEvent(eventId, options = {}) {
  const event = loadSavedEvents().find((item) => item.id === eventId);
  if (!event) return;
  loadEventData(event, options);
}

function loadEventData(event, options = {}) {
  state.eventId = event.id;
  state.eventName = event.name;
  state.eventCreated = true;
  state.eventSeed = event.eventSeed || event.id;
  state.view = "game";
  state.eventDetail = event.eventDetail || "";
  state.combinationMode = event.combinationMode || "new";
  state.combinationSourceEventId = event.combinationSourceEventId || "";
  state.designMode = event.designMode || "new";
  state.designSourceEventId = event.designSourceEventId || "";
  state.cardMode = event.cardMode || "series";
  state.rangeStart = event.rangeStart || 1;
  state.rangeEnd = event.rangeEnd || Math.max(1, Math.round((event.cards || []).length / SERIES_SIZE)) || 5;
  state.configuredSeriesCount = event.configuredSeriesCount || Math.max(1, Math.round((event.cards || []).length / SERIES_SIZE)) || 5;
  state.salesLoaded = !!event.salesLoaded;
  state.soldUnits = normalizeSoldUnits(event.soldUnits || []);
  state.salesDraftUnits = normalizeSoldUnits(event.salesDraftUnits || event.soldUnits || []);
  state.completedGames = Array.isArray(event.completedGames) ? event.completedGames : [];
  state.drawn = event.drawn || [];
  state.cards = [];
  state.prizeAmounts = { ...state.prizeAmounts, ...(event.prizeAmounts || {}) };
  state.prizeSettings = normalizePrizeSettings({ ...state.prizeSettings, ...(event.prizeSettings || {}) });
  state.cardDesign = { ...state.cardDesign, ...(event.cardDesign || {}) };
  state.visualSettings = normalizeVisualSettings(event.visualSettings || {});
  state.stripDesign = { ...createDefaultStripDesign(), ...(event.stripDesign || {}) };
  persistStripDesignDraft();
  state.projectionSettings = normalizeProjectionSettings(event.projectionSettings || {});
  state.prizeResults = event.prizeResults || [];
  state.prizeEnabled = { ...state.prizeEnabled, ...(event.prizeEnabled || {}) };
  state.pausedForWinner = false;
  state.pendingWinners = [];
  state.winnerViewIndex = 0;
  state.gameFinished = !!event.gameFinished;
  state.extraStartBallIndex = event.extraStartBallIndex ?? null;
  state.recapShown = !!event.recapShown;
  state.pozoVacancyShown = !!event.pozoVacancyShown;
  state.extraVacancyShown = !!event.extraVacancyShown;
  state.isProjecting = false;
  state.view = options.stayHome ? "home" : (state.salesLoaded && state.soldUnits.length ? "game" : "sales");
  generateConfiguredCards({ preserveGame: true });
}

function loadSavedEvents() {
  try {
    const deletedIds = new Set(loadDeletedEventIds());
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
      .filter((event) => event && event.id && !deletedIds.has(event.id));
  } catch {
    return [];
  }
}

function saveEventsToLocalStorage(events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.map(stripLargeEventAssets)));
    return true;
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, 1).map(stripLargeEventAssets)));
    } catch {
      // Si tambien falla la copia liviana, seguimos con el estado en memoria y el guardado en servidor.
    }
    return false;
  }
}

function stripLargeEventAssets(event) {
  const next = clonePlain(event);
  if (next.stripDesign) {
    next.stripDesign = {
      ...next.stripDesign,
      backgroundImageData: "",
      backgroundImageName: next.stripDesign.backgroundImageName
        ? `${next.stripDesign.backgroundImageName} (guardada en Cargas)`
        : "",
    };
  }
  if (next.visualSettings) {
    next.visualSettings = {
      ...next.visualSettings,
      bingoLogoData: "",
      indigoLogoData: "",
      ballImageKeys: {},
      bingoLogoName: next.visualSettings.bingoLogoName
        ? `${next.visualSettings.bingoLogoName} (guardado en Cargas)`
        : "",
      indigoLogoName: next.visualSettings.indigoLogoName
        ? `${next.visualSettings.indigoLogoName} (guardado en Cargas)`
        : "",
      ballImageSetName: next.visualSettings.ballImageSetName
        ? `${next.visualSettings.ballImageSetName} (guardadas en Cargas)`
        : "",
    };
  }
  return next;
}

function getSavedEventById(eventId) {
  return loadSavedEvents().find((event) => event.id === eventId) || null;
}

function applyDesignFromEvent(sourceEvent) {
  if (!sourceEvent) return;
  state.cardDesign = {
    ...state.cardDesign,
    ...clonePlain(sourceEvent.cardDesign || {}),
  };
  state.visualSettings = normalizeVisualSettings(clonePlain(sourceEvent.visualSettings || {}));
  state.stripDesign = {
    ...createDefaultStripDesign(),
    ...clonePlain(sourceEvent.stripDesign || {}),
  };
  state.projectionSettings = normalizeProjectionSettings(clonePlain(sourceEvent.projectionSettings || {}));
  persistStripDesignDraft();
  applyVisualSettings();
}

function clonePlain(value) {
  try {
    return JSON.parse(JSON.stringify(value || {}));
  } catch {
    return {};
  }
}

function normalizePrizeSettings(settings = {}) {
  const next = { ...settings };
  next.pozoLimitBall = clamp(Number(next.pozoLimitBall) || 30, 30, 90);
  next.pozoBaseLimitBall = clamp(Number(next.pozoBaseLimitBall) || next.pozoLimitBall || 37, 30, 90);
  next.pozoLimitIncrement = clamp(Number(next.pozoLimitIncrement) || 1, 1, 20);
  next.pozoPrize = Math.max(0, Number(next.pozoPrize) || 0);
  next.pozoBasePrize = Math.max(0, Number(next.pozoBasePrize) || next.pozoPrize || 0);
  next.pozoPrizeIncrement = Math.max(0, Number(next.pozoPrizeIncrement) || 0);
  next.extraBasePrize = Math.max(0, Number(next.extraBasePrize) || state.prizeAmounts.extra || 0);
  next.extraPrizeIncrement = Math.max(0, Number(next.extraPrizeIncrement) || next.extraBasePrize || 0);
  next.extraBalls = clamp(Number(next.extraBalls) || 5, 1, 90);
  return next;
}

function loadDeletedEventIds() {
  try {
    return [...new Set(JSON.parse(localStorage.getItem(DELETED_EVENTS_STORAGE_KEY) || "[]"))];
  } catch {
    return [];
  }
}

function saveDeletedEventIds(ids) {
  localStorage.setItem(DELETED_EVENTS_STORAGE_KEY, JSON.stringify([...new Set(ids.filter(Boolean))]));
}

function rememberDeletedEvent(eventId) {
  saveDeletedEventIds([...loadDeletedEventIds(), eventId]);
}

function getAdminPassword() {
  return localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY) || "1234";
}

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  scheduleServerStateSave();
}

function getStats() {
  return {
    series: getGeneratedSeriesCount(),
    cards: getConfiguredCardTotal(),
    soldUnits: state.soldUnits.length,
    soldCards: getSoldCardCount(),
    drawn: state.drawn.length,
    winners: state.prizeResults.length,
  };
}

function getSalesUnitLabel() {
  return state.cardMode === "individual"
    ? { singular: "Carton", plural: "Cartones" }
    : { singular: "Serie", plural: "Series" };
}

function getPlayableCards() {
  if (!state.salesLoaded || !state.soldUnits.length) return [];
  const sold = new Set(state.soldUnits);
  if (state.cardMode === "individual") {
    return state.cards.filter((card) => sold.has(Number(card.cardNumber)));
  }
  return state.cards.filter((card) => sold.has(Number(card.series)));
}

function getSalesDraftUnits() {
  if (Array.isArray(state.salesDraftUnits)) return state.salesDraftUnits;
  return state.soldUnits;
}

function getDraftCardCount() {
  const draftUnits = getSalesDraftUnits();
  if (!draftUnits.length) return 0;
  return state.cardMode === "individual" ? draftUnits.length : draftUnits.length * SERIES_SIZE;
}

function getSoldCardCount() {
  if (!state.salesLoaded || !state.soldUnits.length) return 0;
  if (state.cardMode === "individual") return state.soldUnits.length;
  return state.soldUnits.length * SERIES_SIZE;
}

function normalizeSoldUnits(units) {
  const set = new Set();
  units.forEach((value) => {
    const number = Math.trunc(Number(value));
    if (Number.isInteger(number) && number >= state.rangeStart && number <= state.rangeEnd) {
      set.add(number);
    }
  });
  return [...set].sort((a, b) => a - b);
}

function handleSalesFromKeydown(event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  const value = Number(els.salesFromInput.value) || state.rangeStart;
  els.salesToInput.value = value;
  els.salesToInput.focus();
  els.salesToInput.select();
}

function handleSalesToKeydown(event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  addManualSalesRange();
}

function addManualSalesRange() {
  if (!state.eventCreated) return;
  const rangeToAdd = getManualSalesRange();
  if (!rangeToAdd) return;
  const incomingUnits = range(rangeToAdd.start, rangeToAdd.end);
  const duplicates = getDuplicateSalesInfo(incomingUnits);
  const nextUnits = normalizeSoldUnits([
    ...getSalesDraftUnits(),
    ...incomingUnits,
  ]);
  if (!nextUnits.length) {
    window.alert(`El rango debe estar entre ${state.rangeStart} y ${state.rangeEnd}.`);
    return;
  }
  state.salesDraftUnits = nextUnits;
  saveCurrentEvent({ silent: true });
  prepareNextSalesEntry(rangeToAdd.end + 1);
  render();
  if (duplicates.length) showSalesDuplicateDialog(duplicates, "la carga manual");
}

function getManualSalesRange() {
  const rawStart = Math.trunc(Number(els.salesFromInput.value));
  const rawEnd = Math.trunc(Number(els.salesToInput.value));
  if (!Number.isInteger(rawStart) || !Number.isInteger(rawEnd)) {
    window.alert(`Escribi un numero o rango valido entre ${state.rangeStart} y ${state.rangeEnd}.`);
    return null;
  }
  const start = Math.min(rawStart, rawEnd);
  const end = Math.max(rawStart, rawEnd);
  if (start < state.rangeStart || end > state.rangeEnd) {
    window.alert(`Este evento solo tiene ${getSalesUnitLabel().plural.toLowerCase()} generadas desde ${state.rangeStart} hasta ${state.rangeEnd}. Para cargar ${rawStart}${rawStart === rawEnd ? "" : `-${rawEnd}`}, primero amplia el rango del evento.`);
    return null;
  }
  return { start, end };
}

function prepareNextSalesEntry(nextValue) {
  const safeNext = clamp(Number(nextValue) || state.rangeStart, state.rangeStart, state.rangeEnd);
  els.salesFromInput.value = safeNext;
  els.salesToInput.value = safeNext;
  els.salesFromInput.focus();
  els.salesFromInput.select();
}

function removeSingleSale() {
  const unitsToRemove = normalizeSoldUnits(parseSalesText(els.salesRemoveInput.value));
  if (!unitsToRemove.length) {
    window.alert(`Escribi un numero o rango valido entre ${state.rangeStart} y ${state.rangeEnd}.`);
    return;
  }
  removeSalesUnits(unitsToRemove);
  els.salesRemoveInput.value = "";
}

function removeSalesUnit(unit) {
  const number = Math.trunc(Number(unit));
  if (!Number.isInteger(number)) return;
  removeSalesUnits([number]);
}

function removeSalesRange(start, end) {
  const safe = normalizeRange(start, end);
  removeSalesUnits(range(safe.start, safe.end));
}

function removeSalesUnits(unitsToRemove) {
  const removeSet = new Set(normalizeSoldUnits(unitsToRemove));
  if (!removeSet.size) return;
  const nextUnits = getSalesDraftUnits().filter((unit) => !removeSet.has(unit));
  state.salesDraftUnits = nextUnits;
  saveCurrentEvent({ silent: true });
  render();
}

function getDuplicateSalesInfo(incomingUnits) {
  const currentUnits = getSalesDraftUnits();
  const currentSet = new Set(currentUnits);
  const incomingCounts = new Map();
  incomingUnits.forEach((unit) => {
    const number = Math.trunc(Number(unit));
    if (!Number.isInteger(number) || number < state.rangeStart || number > state.rangeEnd) return;
    incomingCounts.set(number, (incomingCounts.get(number) || 0) + 1);
  });
  const currentRanges = compressNumberRanges(currentUnits);
  return [...incomingCounts.entries()]
    .filter(([unit, count]) => currentSet.has(unit) || count > 1)
    .map(([unit, count]) => ({
      unit,
      count,
      alreadyLoaded: currentSet.has(unit),
      existingRange: findRangeForSalesUnit(unit, currentRanges),
    }))
    .sort((a, b) => a.unit - b.unit);
}

function findRangeForSalesUnit(unit, ranges) {
  return ranges.find((item) => unit >= item.start && unit <= item.end) || null;
}

function showSalesDuplicateDialog(duplicates, sourceLabel) {
  if (!duplicates.length) return;
  const unitLabel = getSalesUnitLabel();
  const duplicateRanges = compressNumberRanges(duplicates.map((item) => item.unit));
  els.salesDuplicateMessage.textContent = `En ${sourceLabel} hay ${duplicates.length} ${unitLabel.singular.toLowerCase()}${duplicates.length === 1 ? "" : "s"} repetida${duplicates.length === 1 ? "" : "s"}. No se cargo nada duplicado; revisa la planilla para corregir el dato.`;
  els.salesDuplicateList.innerHTML = duplicateRanges.map((rangeItem) => {
    const items = duplicates.filter((item) => item.unit >= rangeItem.start && item.unit <= rangeItem.end);
    const existingRanges = [...new Set(items
      .filter((item) => item.existingRange)
      .map((item) => item.existingRange.label))];
    const internalRepeat = items.some((item) => item.count > 1);
    const details = [
      existingRanges.length ? `Ya estaba en: ${existingRanges.join(", ")}` : "",
      internalRepeat ? "Aparece repetida dentro de esta misma carga" : "",
    ].filter(Boolean).join(" - ");
    return `
      <div class="sales-duplicate-item">
        <strong>${unitLabel.singular} ${rangeItem.label}</strong>
        <span>${details || "Repetida"}</span>
      </div>
    `;
  }).join("");
  if (!els.salesDuplicateDialog.open) els.salesDuplicateDialog.showModal();
}

function importSalesFile() {
  const file = els.salesImportInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const parsed = parseSalesText(String(reader.result || ""));
    const duplicates = getDuplicateSalesInfo(parsed);
    const nextUnits = normalizeSoldUnits([...getSalesDraftUnits(), ...parsed]);
    if (!nextUnits.length) {
      window.alert(`No encontre ${getSalesUnitLabel().plural.toLowerCase()} validas entre ${state.rangeStart} y ${state.rangeEnd}.`);
      els.salesImportInput.value = "";
      return;
    }
    state.salesDraftUnits = nextUnits;
    saveCurrentEvent({ silent: true });
    els.salesImportInput.value = "";
    render();
    if (duplicates.length) showSalesDuplicateDialog(duplicates, `el archivo ${file.name}`);
  };
  reader.readAsText(file);
}

function parseSalesText(text) {
  const withoutComments = text
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("#"))
    .join("\n");
  const normalized = withoutComments
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\bal\b/gi, "-")
    .replace(/\bdesde\b/gi, "")
    .replace(/\bhasta\b/gi, "-");
  const matches = normalized.match(/\d+\s*-\s*\d+|\d+/g) || [];
  const units = [];
  matches.forEach((match) => {
    if (match.includes("-")) {
      const [start, end] = match.split("-").map((part) => Number(part.trim()));
      if (Number.isFinite(start) && Number.isFinite(end)) {
        const safe = normalizeRange(start, end);
        units.push(...range(safe.start, safe.end));
      }
      return;
    }
    units.push(Number(match));
  });
  return units;
}

function exportSalesFile() {
  const draftUnits = getSalesDraftUnits();
  if (!draftUnits.length) {
    window.alert("Todavia no hay ventas para exportar.");
    return;
  }
  const unitLabel = getSalesUnitLabel();
  const lines = [
    `# Evento: ${state.eventName}`,
    `# Modo: ${unitLabel.plural}`,
    `# Rango generado: ${state.rangeStart}-${state.rangeEnd}`,
    `# Vendidas: ${draftUnits.length}`,
    "",
    ...draftUnits.map(String),
  ];
  downloadTextFile(`ventas-${slugify(state.eventName)}.dat`, lines.join("\n"));
}

function clearSales() {
  if (!getSalesDraftUnits().length) return;
  const confirmed = window.confirm("Limpiar todas las ventas cargadas?");
  if (!confirmed) return;
  state.salesDraftUnits = [];
  state.soldUnits = [];
  state.salesLoaded = false;
  rebuildPrizeResults();
  saveCurrentEvent({ silent: true });
  render();
}

function activateSales() {
  const draftUnits = getSalesDraftUnits();
  if (!draftUnits.length) {
    window.alert("Carga al menos una serie o carton antes de activar ventas.");
    return;
  }
  state.soldUnits = normalizeSoldUnits(draftUnits);
  state.salesDraftUnits = [...state.soldUnits];
  state.salesLoaded = true;
  window.alert("Ventas activadas. El bingo ya reconoce solo esos cartones en juego.");
  if (state.currentUser) {
    state.view = "user-events";
  }
  generateConfiguredCards({ preserveGame: true });
  saveCurrentEvent({ silent: true });
  render();
}

function compressNumberRanges(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const ranges = [];
  let start = sorted[0];
  let previous = sorted[0];
  sorted.slice(1).forEach((number) => {
    if (number === previous + 1) {
      previous = number;
      return;
    }
    ranges.push({
      start,
      end: previous,
      label: start === previous ? `${start}` : `${start}-${previous}`,
    });
    start = number;
    previous = number;
  });
  ranges.push({
    start,
    end: previous,
    label: start === previous ? `${start}` : `${start}-${previous}`,
  });
  return ranges;
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  downloadBlob(filename, blob);
}

async function downloadBlob(filename, blob) {
  const extension = filename.includes(".") ? `.${filename.split(".").pop()}` : ".txt";
  const mimeType = blob.type || "application/octet-stream";

  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: extension ? `Archivo ${extension.toUpperCase()}` : "Archivo",
            accept: { [mimeType]: [extension] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildStoredZip(files) {
  const encoder = new TextEncoder();
  const parts = [];
  const centralParts = [];
  let offset = 0;
  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const data = typeof file.content === "string" ? encoder.encode(file.content) : file.content;
    const crc = crc32(data);
    const localHeader = createZipHeader({
      signature: 0x04034b50,
      crc,
      compressedSize: data.length,
      uncompressedSize: data.length,
      nameBytes,
    });
    parts.push(localHeader, nameBytes, data);
    const centralHeader = createZipHeader({
      signature: 0x02014b50,
      crc,
      compressedSize: data.length,
      uncompressedSize: data.length,
      nameBytes,
      offset,
      central: true,
    });
    centralParts.push(centralHeader, nameBytes);
    offset += localHeader.length + nameBytes.length + data.length;
  });
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const view = new DataView(end.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, files.length, true);
  view.setUint16(10, files.length, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, offset, true);
  return new Blob([...parts, ...centralParts, end], { type: "application/zip" });
}

function createZipHeader({ signature, crc, compressedSize, uncompressedSize, nameBytes, offset = 0, central = false }) {
  const header = new Uint8Array(central ? 46 : 30);
  const view = new DataView(header.buffer);
  const { time, date } = getZipDateTime();
  view.setUint32(0, signature, true);
  if (central) {
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(12, time, true);
    view.setUint16(14, date, true);
    view.setUint32(16, crc, true);
    view.setUint32(20, compressedSize, true);
    view.setUint32(24, uncompressedSize, true);
    view.setUint16(28, nameBytes.length, true);
    view.setUint32(42, offset, true);
    return header;
  }
  view.setUint16(4, 20, true);
  view.setUint16(10, time, true);
  view.setUint16(12, date, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, compressedSize, true);
  view.setUint32(22, uncompressedSize, true);
  view.setUint16(26, nameBytes.length, true);
  return header;
}

function getZipDateTime() {
  const now = new Date();
  return {
    time: (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2),
    date: ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate(),
  };
}

function crc32(data) {
  let crc = 0xffffffff;
  for (let index = 0; index < data.length; index += 1) {
    crc = CRC32_TABLE[(crc ^ data[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function slugify(value) {
  return String(value || "evento")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "evento";
}

function getGeneratedSeriesCount() {
  if (state.cardMode === "individual") return 0;
  if (state.salesLoaded && state.soldUnits.length) return state.soldUnits.length;
  return new Set(state.cards.map((card) => card.series).filter(Boolean)).size;
}

function getConfiguredUnitCount() {
  const range = normalizeRange(state.rangeStart, state.rangeEnd);
  return range.end - range.start + 1;
}

function getConfiguredCardTotal() {
  const units = getConfiguredUnitCount();
  return state.cardMode === "individual" ? units : units * SERIES_SIZE;
}

function getGenerationUnits() {
  if (state.salesLoaded && state.soldUnits.length) {
    return normalizeSoldUnits(state.soldUnits);
  }
  return range(state.rangeStart, state.rangeEnd);
}

function getGenerationCardTotal() {
  const units = getGenerationUnits().length;
  return state.cardMode === "individual" ? units : units * SERIES_SIZE;
}

function getFirstCardNumberForSeries(seriesNumber) {
  return ((Number(seriesNumber) || 1) - 1) * SERIES_SIZE + 1;
}

function normalizeRange(start, end) {
  const normalizedStart = clamp(Math.trunc(start), 1, 20000);
  const normalizedEnd = clamp(Math.trunc(end), 1, 20000);
  return {
    start: Math.min(normalizedStart, normalizedEnd),
    end: Math.max(normalizedStart, normalizedEnd),
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getMoneyInputs() {
  return [
    els.eventCuaternoPrizeInput,
    els.eventLineaPrizeInput,
    els.eventSegundaLineaPrizeInput,
    els.eventPozoPrizeInput,
    els.eventPozoBasePrizeInput,
    els.eventPozoPrizeIncrementInput,
    els.eventBingoPrizeInput,
    els.eventExtraPrizeInput,
    els.eventExtraBasePrizeInput,
    els.eventExtraPrizeIncrementInput,
  ].filter(Boolean);
}

function getTypographyInputs() {
  return [
    els.eventHeaderFontFamilyInput,
    els.eventHeaderTitleSizeInput,
    els.eventHeaderTitleColorInput,
    els.eventHeaderPrizeFontFamilyInput,
    els.eventHeaderPrizeSizeInput,
    els.eventHeaderPrizeColorInput,
    els.eventPrizeFontFamilyInput,
    els.eventPrizeNameSizeInput,
    els.eventPrizeNameColorInput,
    els.eventPrizeAmountSizeInput,
    els.eventPrizeAmountColorInput,
    els.eventPanelHeadingColorInput,
    els.eventPanelTextColorInput,
    els.eventProjectionFontFamilyInput,
    els.eventProjectionTitleSizeInput,
    els.eventProjectionTitleColorInput,
    els.eventProjectionDetailColorInput,
  ].filter(Boolean);
}

function parseMoneyInput(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return Math.max(0, Number(digits) || 0);
}

function formatIntegerMoney(value) {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(Math.max(0, Number(value) || 0));
}

function setMoneyInput(input, value) {
  if (input) input.value = formatIntegerMoney(value);
}

function formatMoney(value) {
  return `$ ${formatIntegerMoney(value)}`;
}

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function shuffle(values, random = Math.random) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function weightedPick(candidates, weights, random = Math.random) {
  const total = candidates.reduce((sum, column) => sum + weights[column], 0);
  let pick = random() * total;
  for (const column of candidates) {
    pick -= weights[column];
    if (pick <= 0) return column;
  }
  return candidates.at(-1);
}

function createSeededRandom(seedText) {
  let seed = 2166136261;
  for (const character of seedText) {
    seed ^= character.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createDefaultVisualSettings() {
  return {
    accentColor: "#d1223b",
    panelColor: "#17212b",
    ballSize: 74,
    buttonRadius: 8,
    screenMarginTop: 0,
    screenMarginBottom: 16,
    screenMarginLeft: 0,
    screenMarginRight: 0,
    bingoLogoData: "",
    bingoLogoName: "",
    bingoLogoSize: 158,
    indigoLogoData: "",
    indigoLogoName: "",
    indigoLogoSize: 118,
    ballImageKeys: {},
    ballImageSetName: "",
    boardPanelWidth: 150,
    boardFontFamily: "Arial, Helvetica, sans-serif",
    boardFontSize: 22,
    sideTitleSize: 19,
    sideTextSize: 16,
    boardButtonColor: "#1f2933",
    boardTextColor: "#bcd7f3",
    boardDrawnColor: "#ffcb45",
    boardDrawnTextColor: "#111111",
    boardMarkEffect: "zoom",
    boardShadow: true,
    boardNumberShadow: false,
    boardNeon: false,
    headerFontFamily: "Arial, Helvetica, sans-serif",
    headerTitleSize: 26,
    headerTitleColor: "#ffffff",
    headerPrizeFontFamily: "Arial, Helvetica, sans-serif",
    headerPrizeSize: 16,
    headerPrizeColor: "#ffcb45",
    prizeFontFamily: "Arial, Helvetica, sans-serif",
    prizeNameSize: 16,
    prizeNameColor: "#2fbf71",
    prizeAmountSize: 18,
    prizeAmountColor: "#ffcb45",
    panelHeadingColor: "#ffffff",
    panelTextColor: "#c7d7ea",
    projectionFontFamily: "Arial, Helvetica, sans-serif",
    projectionTitleSize: 80,
    projectionTitleColor: "#ffffff",
    projectionDetailColor: "#e2e7ee",
  };
}

function normalizeVisualSettings(settings = {}) {
  const next = { ...createDefaultVisualSettings(), ...settings };
  next.bingoLogoSize = Number(next.bingoLogoSize) < 60 ? 158 : clamp(Number(next.bingoLogoSize) || 158, 60, 360);
  next.indigoLogoSize = Number(next.indigoLogoSize) < 60 ? 118 : clamp(Number(next.indigoLogoSize) || 118, 60, 320);
  next.boardPanelWidth = Number(next.boardPanelWidth) < 100 ? 150 : clamp(Number(next.boardPanelWidth) || 150, 100, 220);
  next.boardFontSize = clamp(Number(next.boardFontSize) || 22, 12, 260);
  next.sideTitleSize = clamp(Number(next.sideTitleSize) || 19, 12, 120);
  next.sideTextSize = clamp(Number(next.sideTextSize) || 16, 12, 120);
  if (!["none", "zoom", "spin", "sweep", "pulse"].includes(next.boardMarkEffect)) next.boardMarkEffect = "zoom";
  return next;
}

function applyVisualSettings() {
  state.visualSettings = normalizeVisualSettings(state.visualSettings);
  document.documentElement.style.setProperty("--accent", state.visualSettings.accentColor);
  document.documentElement.style.setProperty("--panel", state.visualSettings.panelColor);
  document.documentElement.style.setProperty("--last-ball-size", `${state.visualSettings.ballSize}px`);
  document.documentElement.style.setProperty("--button-radius", `${state.visualSettings.buttonRadius}px`);
  document.documentElement.style.setProperty("--screen-margin-top", `${state.visualSettings.screenMarginTop}px`);
  document.documentElement.style.setProperty("--screen-margin-bottom", `${state.visualSettings.screenMarginBottom}px`);
  document.documentElement.style.setProperty("--screen-margin-left", `${state.visualSettings.screenMarginLeft}px`);
  document.documentElement.style.setProperty("--screen-margin-right", `${state.visualSettings.screenMarginRight}px`);
  document.documentElement.style.setProperty("--bingo-logo-size", `${state.visualSettings.bingoLogoSize}px`);
  document.documentElement.style.setProperty("--indigo-logo-size", `${state.visualSettings.indigoLogoSize}px`);
  document.documentElement.style.setProperty("--number-board-fr", `${state.visualSettings.boardPanelWidth / 100}fr`);
  document.documentElement.style.setProperty("--board-font-family", state.visualSettings.boardFontFamily);
  document.documentElement.style.setProperty("--board-font-size", `${state.visualSettings.boardFontSize}px`);
  document.documentElement.style.setProperty("--side-title-size", `${state.visualSettings.sideTitleSize}px`);
  document.documentElement.style.setProperty("--side-text-size", `${state.visualSettings.sideTextSize}px`);
  document.documentElement.style.setProperty("--board-button-color", state.visualSettings.boardButtonColor);
  document.documentElement.style.setProperty("--board-text-color", state.visualSettings.boardTextColor);
  document.documentElement.style.setProperty("--board-drawn-color", state.visualSettings.boardDrawnColor);
  document.documentElement.style.setProperty("--board-drawn-text-color", state.visualSettings.boardDrawnTextColor);
  document.documentElement.style.setProperty("--game-title-font-family", state.visualSettings.headerFontFamily);
  document.documentElement.style.setProperty("--game-title-size", `${state.visualSettings.headerTitleSize}px`);
  document.documentElement.style.setProperty("--game-title-color", state.visualSettings.headerTitleColor);
  document.documentElement.style.setProperty("--game-status-font-family", state.visualSettings.headerPrizeFontFamily);
  document.documentElement.style.setProperty("--game-status-size", `${state.visualSettings.headerPrizeSize}px`);
  document.documentElement.style.setProperty("--game-status-color", state.visualSettings.headerPrizeColor);
  document.documentElement.style.setProperty("--prize-font-family", state.visualSettings.prizeFontFamily);
  document.documentElement.style.setProperty("--prize-name-size", `${state.visualSettings.prizeNameSize}px`);
  document.documentElement.style.setProperty("--prize-name-color", state.visualSettings.prizeNameColor);
  document.documentElement.style.setProperty("--prize-amount-size", `${state.visualSettings.prizeAmountSize}px`);
  document.documentElement.style.setProperty("--prize-amount-color", state.visualSettings.prizeAmountColor);
  document.documentElement.style.setProperty("--panel-heading-color", state.visualSettings.panelHeadingColor);
  document.documentElement.style.setProperty("--panel-text-color", state.visualSettings.panelTextColor);
  document.documentElement.style.setProperty("--projection-font-family", state.visualSettings.projectionFontFamily);
  document.documentElement.style.setProperty("--projection-title-size", `${state.visualSettings.projectionTitleSize}px`);
  document.documentElement.style.setProperty("--projection-title-color", state.visualSettings.projectionTitleColor);
  document.documentElement.style.setProperty("--projection-detail-color", state.visualSettings.projectionDetailColor);
  document.body.classList.toggle("board-shadow-off", !state.visualSettings.boardShadow);
  document.body.classList.toggle("board-number-shadow-on", !!state.visualSettings.boardNumberShadow);
  document.body.classList.toggle("board-neon-on", !!state.visualSettings.boardNeon);
  ["none", "zoom", "spin", "sweep", "pulse"].forEach((effect) => {
    document.body.classList.toggle(`board-mark-effect-${effect}`, state.visualSettings.boardMarkEffect === effect);
  });
  updateHeaderLogo(els.gameBingoLogo, state.visualSettings.bingoLogoData);
  updateHeaderLogo(els.gameIndigoLogo, state.visualSettings.indigoLogoData);
}

function updateHeaderLogo(image, source) {
  if (!image) return;
  image.src = source || "";
  image.parentElement.classList.toggle("has-logo", !!source);
}

function createDefaultStripDesign() {
  return {
    headerHeight: 68,
    paperSize: "a4",
    orientation: "landscape",
    contentMode: "strip",
    exportLimit: 300,
    itemsPerPage: 1,
    orderMode: "consecutive",
    columns: 1,
    gap: 8,
    rowGap: 8,
    offsetX: 0,
    offsetY: 0,
    accentColor: "#d1223b",
    backgroundColor: "#ffffff",
    fontSize: 16,
    fontFamily: "Arial, Helvetica, sans-serif",
    seriesLabel: "Serie N°",
    seriesFontSize: 13,
    seriesOffsetX: 0,
    seriesOffsetY: 0,
    seriesFontFamily: "Arial, Helvetica, sans-serif",
    seriesColor: "#111827",
    numberColor: "#111827",
    cardScale: 100,
    cellSize: 18,
    cellShape: "square",
    cellBorderColor: "#111827",
    cellBgEnabled: false,
    cellBgColor: "#ffffff",
    backgroundImageData: "",
    backgroundImageName: "",
    printContentScale: 1,
  };
}

function loadPersistedStripDesign() {
  try {
    const saved = JSON.parse(localStorage.getItem(STRIP_DESIGN_STORAGE_KEY) || "{}");
    return { ...createDefaultStripDesign(), ...saved };
  } catch {
    return createDefaultStripDesign();
  }
}

function createDefaultProjectionSettings() {
  return {
    recapLeadBalls: 3,
    recapSeconds: 8,
    recapMediaKey: "",
    recapMediaName: "",
    winnerSeconds: 5,
    announcements: Object.fromEntries(
      announcementDefinitions.map((announcement) => [announcement.id, { mediaKey: "", mediaName: "" }]),
    ),
  };
}

function normalizeProjectionSettings(settings = {}) {
  const normalized = { ...createDefaultProjectionSettings(), ...settings };
  normalized.announcements = {
    ...createDefaultProjectionSettings().announcements,
    ...(settings.announcements || {}),
  };
  if (settings.winnerMediaKey) {
    announcementDefinitions.forEach((announcement) => {
      if (!normalized.announcements[announcement.id]?.mediaKey) {
        normalized.announcements[announcement.id] = {
          mediaKey: settings.winnerMediaKey,
          mediaName: settings.winnerMediaName || "",
        };
      }
    });
  }
  return normalized;
}

function getAnnouncementDefinition(announcementId) {
  return announcementDefinitions.find((announcement) => announcement.id === announcementId);
}

function getAnnouncementMedia(announcementId) {
  return state.projectionSettings.announcements?.[announcementId] || { mediaKey: "", mediaName: "" };
}

async function handleMediaSelection(kind, input) {
  const file = input.files[0];
  if (!file) return;
  const allowedTypes = new Set(["image/jpeg", "image/png", "video/mp4"]);
  if (!allowedTypes.has(file.type)) {
    window.alert("Formato no admitido. Selecciona una imagen JPG, JPEG o PNG, o un video MP4.");
    input.value = "";
    return;
  }
  const mediaKey = `${state.eventId}-${kind}-${createId()}`;
  try {
    await storeMediaFile(mediaKey, file);
  } catch {
    window.alert("No se pudo guardar el archivo multimedia en este navegador.");
    input.value = "";
    return;
  }
  if (kind === "recap") {
    state.projectionSettings.recapMediaKey = mediaKey;
    state.projectionSettings.recapMediaName = file.name;
  } else if (kind.startsWith("announcement:")) {
    const announcementId = kind.split(":")[1];
    state.projectionSettings.announcements[announcementId] = { mediaKey, mediaName: file.name };
  }
  renderMediaStatus();
  if (state.eventCreated) saveCurrentEvent({ silent: true });
}

function renderMediaStatus() {
  const settings = state.projectionSettings;
  els.eventRecapMediaStatus.textContent = settings.recapMediaName
    ? `Archivo cargado: ${settings.recapMediaName}`
    : "Se usara la placa predeterminada del sistema.";
  announcementDefinitions.forEach((announcement) => {
    const status = document.querySelector(`[data-announcement-status="${announcement.id}"]`);
    if (!status) return;
    const media = getAnnouncementMedia(announcement.id);
    status.textContent = media.mediaName
      ? `Archivo cargado: ${media.mediaName}`
      : "Se usara la placa predeterminada del sistema.";
  });
}

function openMediaDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MEDIA_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(MEDIA_STORE_NAME)) {
        request.result.createObjectStore(MEDIA_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeMediaFile(key, file) {
  const database = await openMediaDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(MEDIA_STORE_NAME, "readwrite");
    transaction.objectStore(MEDIA_STORE_NAME).put(file, key);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

async function loadMediaFile(key) {
  const database = await openMediaDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(MEDIA_STORE_NAME, "readonly");
    const request = transaction.objectStore(MEDIA_STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

init();
