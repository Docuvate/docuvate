// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'global_chat_suggestion_bootstrap_dto_class.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$GlobalChatSuggestionBootstrapDtoClass
    extends GlobalChatSuggestionBootstrapDtoClass {
  @override
  final String topTagId;
  @override
  final String topTagName;
  @override
  final num topTagDocumentCount;
  @override
  final num amountTaggedDocumentCount;
  @override
  final GlobalChatSuggestionBootstrapDtoClassContractEndSample?
      contractEndSample;
  @override
  final BuiltList<String> recentQuestions;

  factory _$GlobalChatSuggestionBootstrapDtoClass(
          [void Function(GlobalChatSuggestionBootstrapDtoClassBuilder)?
              updates]) =>
      (new GlobalChatSuggestionBootstrapDtoClassBuilder()..update(updates))
          ._build();

  _$GlobalChatSuggestionBootstrapDtoClass._(
      {required this.topTagId,
      required this.topTagName,
      required this.topTagDocumentCount,
      required this.amountTaggedDocumentCount,
      this.contractEndSample,
      required this.recentQuestions})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        topTagId, r'GlobalChatSuggestionBootstrapDtoClass', 'topTagId');
    BuiltValueNullFieldError.checkNotNull(
        topTagName, r'GlobalChatSuggestionBootstrapDtoClass', 'topTagName');
    BuiltValueNullFieldError.checkNotNull(topTagDocumentCount,
        r'GlobalChatSuggestionBootstrapDtoClass', 'topTagDocumentCount');
    BuiltValueNullFieldError.checkNotNull(amountTaggedDocumentCount,
        r'GlobalChatSuggestionBootstrapDtoClass', 'amountTaggedDocumentCount');
    BuiltValueNullFieldError.checkNotNull(recentQuestions,
        r'GlobalChatSuggestionBootstrapDtoClass', 'recentQuestions');
  }

  @override
  GlobalChatSuggestionBootstrapDtoClass rebuild(
          void Function(GlobalChatSuggestionBootstrapDtoClassBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  GlobalChatSuggestionBootstrapDtoClassBuilder toBuilder() =>
      new GlobalChatSuggestionBootstrapDtoClassBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is GlobalChatSuggestionBootstrapDtoClass &&
        topTagId == other.topTagId &&
        topTagName == other.topTagName &&
        topTagDocumentCount == other.topTagDocumentCount &&
        amountTaggedDocumentCount == other.amountTaggedDocumentCount &&
        contractEndSample == other.contractEndSample &&
        recentQuestions == other.recentQuestions;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, topTagId.hashCode);
    _$hash = $jc(_$hash, topTagName.hashCode);
    _$hash = $jc(_$hash, topTagDocumentCount.hashCode);
    _$hash = $jc(_$hash, amountTaggedDocumentCount.hashCode);
    _$hash = $jc(_$hash, contractEndSample.hashCode);
    _$hash = $jc(_$hash, recentQuestions.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'GlobalChatSuggestionBootstrapDtoClass')
          ..add('topTagId', topTagId)
          ..add('topTagName', topTagName)
          ..add('topTagDocumentCount', topTagDocumentCount)
          ..add('amountTaggedDocumentCount', amountTaggedDocumentCount)
          ..add('contractEndSample', contractEndSample)
          ..add('recentQuestions', recentQuestions))
        .toString();
  }
}

class GlobalChatSuggestionBootstrapDtoClassBuilder
    implements
        Builder<GlobalChatSuggestionBootstrapDtoClass,
            GlobalChatSuggestionBootstrapDtoClassBuilder> {
  _$GlobalChatSuggestionBootstrapDtoClass? _$v;

  String? _topTagId;
  String? get topTagId => _$this._topTagId;
  set topTagId(String? topTagId) => _$this._topTagId = topTagId;

  String? _topTagName;
  String? get topTagName => _$this._topTagName;
  set topTagName(String? topTagName) => _$this._topTagName = topTagName;

  num? _topTagDocumentCount;
  num? get topTagDocumentCount => _$this._topTagDocumentCount;
  set topTagDocumentCount(num? topTagDocumentCount) =>
      _$this._topTagDocumentCount = topTagDocumentCount;

  num? _amountTaggedDocumentCount;
  num? get amountTaggedDocumentCount => _$this._amountTaggedDocumentCount;
  set amountTaggedDocumentCount(num? amountTaggedDocumentCount) =>
      _$this._amountTaggedDocumentCount = amountTaggedDocumentCount;

  GlobalChatSuggestionBootstrapDtoClassContractEndSampleBuilder?
      _contractEndSample;
  GlobalChatSuggestionBootstrapDtoClassContractEndSampleBuilder
      get contractEndSample => _$this._contractEndSample ??=
          new GlobalChatSuggestionBootstrapDtoClassContractEndSampleBuilder();
  set contractEndSample(
          GlobalChatSuggestionBootstrapDtoClassContractEndSampleBuilder?
              contractEndSample) =>
      _$this._contractEndSample = contractEndSample;

  ListBuilder<String>? _recentQuestions;
  ListBuilder<String> get recentQuestions =>
      _$this._recentQuestions ??= new ListBuilder<String>();
  set recentQuestions(ListBuilder<String>? recentQuestions) =>
      _$this._recentQuestions = recentQuestions;

  GlobalChatSuggestionBootstrapDtoClassBuilder() {
    GlobalChatSuggestionBootstrapDtoClass._defaults(this);
  }

  GlobalChatSuggestionBootstrapDtoClassBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _topTagId = $v.topTagId;
      _topTagName = $v.topTagName;
      _topTagDocumentCount = $v.topTagDocumentCount;
      _amountTaggedDocumentCount = $v.amountTaggedDocumentCount;
      _contractEndSample = $v.contractEndSample?.toBuilder();
      _recentQuestions = $v.recentQuestions.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(GlobalChatSuggestionBootstrapDtoClass other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$GlobalChatSuggestionBootstrapDtoClass;
  }

  @override
  void update(
      void Function(GlobalChatSuggestionBootstrapDtoClassBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  GlobalChatSuggestionBootstrapDtoClass build() => _build();

  _$GlobalChatSuggestionBootstrapDtoClass _build() {
    _$GlobalChatSuggestionBootstrapDtoClass _$result;
    try {
      _$result = _$v ??
          new _$GlobalChatSuggestionBootstrapDtoClass._(
              topTagId: BuiltValueNullFieldError.checkNotNull(topTagId,
                  r'GlobalChatSuggestionBootstrapDtoClass', 'topTagId'),
              topTagName: BuiltValueNullFieldError.checkNotNull(topTagName,
                  r'GlobalChatSuggestionBootstrapDtoClass', 'topTagName'),
              topTagDocumentCount: BuiltValueNullFieldError.checkNotNull(
                  topTagDocumentCount,
                  r'GlobalChatSuggestionBootstrapDtoClass',
                  'topTagDocumentCount'),
              amountTaggedDocumentCount: BuiltValueNullFieldError.checkNotNull(
                  amountTaggedDocumentCount,
                  r'GlobalChatSuggestionBootstrapDtoClass',
                  'amountTaggedDocumentCount'),
              contractEndSample: _contractEndSample?.build(),
              recentQuestions: recentQuestions.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'contractEndSample';
        _contractEndSample?.build();
        _$failedField = 'recentQuestions';
        recentQuestions.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'GlobalChatSuggestionBootstrapDtoClass',
            _$failedField,
            e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
