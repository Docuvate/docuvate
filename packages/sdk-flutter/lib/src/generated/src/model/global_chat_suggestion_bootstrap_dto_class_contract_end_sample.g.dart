// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'global_chat_suggestion_bootstrap_dto_class_contract_end_sample.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$GlobalChatSuggestionBootstrapDtoClassContractEndSample
    extends GlobalChatSuggestionBootstrapDtoClassContractEndSample {
  @override
  final String label;
  @override
  final String value;

  factory _$GlobalChatSuggestionBootstrapDtoClassContractEndSample(
          [void Function(
                  GlobalChatSuggestionBootstrapDtoClassContractEndSampleBuilder)?
              updates]) =>
      (new GlobalChatSuggestionBootstrapDtoClassContractEndSampleBuilder()
            ..update(updates))
          ._build();

  _$GlobalChatSuggestionBootstrapDtoClassContractEndSample._(
      {required this.label, required this.value})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(label,
        r'GlobalChatSuggestionBootstrapDtoClassContractEndSample', 'label');
    BuiltValueNullFieldError.checkNotNull(value,
        r'GlobalChatSuggestionBootstrapDtoClassContractEndSample', 'value');
  }

  @override
  GlobalChatSuggestionBootstrapDtoClassContractEndSample rebuild(
          void Function(
                  GlobalChatSuggestionBootstrapDtoClassContractEndSampleBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  GlobalChatSuggestionBootstrapDtoClassContractEndSampleBuilder toBuilder() =>
      new GlobalChatSuggestionBootstrapDtoClassContractEndSampleBuilder()
        ..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is GlobalChatSuggestionBootstrapDtoClassContractEndSample &&
        label == other.label &&
        value == other.value;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, label.hashCode);
    _$hash = $jc(_$hash, value.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'GlobalChatSuggestionBootstrapDtoClassContractEndSample')
          ..add('label', label)
          ..add('value', value))
        .toString();
  }
}

class GlobalChatSuggestionBootstrapDtoClassContractEndSampleBuilder
    implements
        Builder<GlobalChatSuggestionBootstrapDtoClassContractEndSample,
            GlobalChatSuggestionBootstrapDtoClassContractEndSampleBuilder> {
  _$GlobalChatSuggestionBootstrapDtoClassContractEndSample? _$v;

  String? _label;
  String? get label => _$this._label;
  set label(String? label) => _$this._label = label;

  String? _value;
  String? get value => _$this._value;
  set value(String? value) => _$this._value = value;

  GlobalChatSuggestionBootstrapDtoClassContractEndSampleBuilder() {
    GlobalChatSuggestionBootstrapDtoClassContractEndSample._defaults(this);
  }

  GlobalChatSuggestionBootstrapDtoClassContractEndSampleBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _label = $v.label;
      _value = $v.value;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(GlobalChatSuggestionBootstrapDtoClassContractEndSample other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$GlobalChatSuggestionBootstrapDtoClassContractEndSample;
  }

  @override
  void update(
      void Function(
              GlobalChatSuggestionBootstrapDtoClassContractEndSampleBuilder)?
          updates) {
    if (updates != null) updates(this);
  }

  @override
  GlobalChatSuggestionBootstrapDtoClassContractEndSample build() => _build();

  _$GlobalChatSuggestionBootstrapDtoClassContractEndSample _build() {
    final _$result = _$v ??
        new _$GlobalChatSuggestionBootstrapDtoClassContractEndSample._(
            label: BuiltValueNullFieldError.checkNotNull(
                label,
                r'GlobalChatSuggestionBootstrapDtoClassContractEndSample',
                'label'),
            value: BuiltValueNullFieldError.checkNotNull(
                value,
                r'GlobalChatSuggestionBootstrapDtoClassContractEndSample',
                'value'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
