// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_chat_unavailable_backend_info_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentChatUnavailableBackendInfoDto
    extends DocumentChatUnavailableBackendInfoDto {
  @override
  final String id;
  @override
  final String label;
  @override
  final String reason;
  @override
  final String setupHint;

  factory _$DocumentChatUnavailableBackendInfoDto(
          [void Function(DocumentChatUnavailableBackendInfoDtoBuilder)?
              updates]) =>
      (new DocumentChatUnavailableBackendInfoDtoBuilder()..update(updates))
          ._build();

  _$DocumentChatUnavailableBackendInfoDto._(
      {required this.id,
      required this.label,
      required this.reason,
      required this.setupHint})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        id, r'DocumentChatUnavailableBackendInfoDto', 'id');
    BuiltValueNullFieldError.checkNotNull(
        label, r'DocumentChatUnavailableBackendInfoDto', 'label');
    BuiltValueNullFieldError.checkNotNull(
        reason, r'DocumentChatUnavailableBackendInfoDto', 'reason');
    BuiltValueNullFieldError.checkNotNull(
        setupHint, r'DocumentChatUnavailableBackendInfoDto', 'setupHint');
  }

  @override
  DocumentChatUnavailableBackendInfoDto rebuild(
          void Function(DocumentChatUnavailableBackendInfoDtoBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentChatUnavailableBackendInfoDtoBuilder toBuilder() =>
      new DocumentChatUnavailableBackendInfoDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentChatUnavailableBackendInfoDto &&
        id == other.id &&
        label == other.label &&
        reason == other.reason &&
        setupHint == other.setupHint;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, label.hashCode);
    _$hash = $jc(_$hash, reason.hashCode);
    _$hash = $jc(_$hash, setupHint.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'DocumentChatUnavailableBackendInfoDto')
          ..add('id', id)
          ..add('label', label)
          ..add('reason', reason)
          ..add('setupHint', setupHint))
        .toString();
  }
}

class DocumentChatUnavailableBackendInfoDtoBuilder
    implements
        Builder<DocumentChatUnavailableBackendInfoDto,
            DocumentChatUnavailableBackendInfoDtoBuilder> {
  _$DocumentChatUnavailableBackendInfoDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _label;
  String? get label => _$this._label;
  set label(String? label) => _$this._label = label;

  String? _reason;
  String? get reason => _$this._reason;
  set reason(String? reason) => _$this._reason = reason;

  String? _setupHint;
  String? get setupHint => _$this._setupHint;
  set setupHint(String? setupHint) => _$this._setupHint = setupHint;

  DocumentChatUnavailableBackendInfoDtoBuilder() {
    DocumentChatUnavailableBackendInfoDto._defaults(this);
  }

  DocumentChatUnavailableBackendInfoDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _label = $v.label;
      _reason = $v.reason;
      _setupHint = $v.setupHint;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentChatUnavailableBackendInfoDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DocumentChatUnavailableBackendInfoDto;
  }

  @override
  void update(
      void Function(DocumentChatUnavailableBackendInfoDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentChatUnavailableBackendInfoDto build() => _build();

  _$DocumentChatUnavailableBackendInfoDto _build() {
    final _$result = _$v ??
        new _$DocumentChatUnavailableBackendInfoDto._(
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'DocumentChatUnavailableBackendInfoDto', 'id'),
            label: BuiltValueNullFieldError.checkNotNull(
                label, r'DocumentChatUnavailableBackendInfoDto', 'label'),
            reason: BuiltValueNullFieldError.checkNotNull(
                reason, r'DocumentChatUnavailableBackendInfoDto', 'reason'),
            setupHint: BuiltValueNullFieldError.checkNotNull(setupHint,
                r'DocumentChatUnavailableBackendInfoDto', 'setupHint'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
