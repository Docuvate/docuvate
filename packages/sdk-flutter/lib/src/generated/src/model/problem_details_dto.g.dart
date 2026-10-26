// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'problem_details_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ProblemDetailsDto extends ProblemDetailsDto {
  @override
  final String type;
  @override
  final String title;
  @override
  final num status;
  @override
  final String code;
  @override
  final String detail;
  @override
  final String requestId;

  factory _$ProblemDetailsDto(
          [void Function(ProblemDetailsDtoBuilder)? updates]) =>
      (new ProblemDetailsDtoBuilder()..update(updates))._build();

  _$ProblemDetailsDto._(
      {required this.type,
      required this.title,
      required this.status,
      required this.code,
      required this.detail,
      required this.requestId})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(type, r'ProblemDetailsDto', 'type');
    BuiltValueNullFieldError.checkNotNull(title, r'ProblemDetailsDto', 'title');
    BuiltValueNullFieldError.checkNotNull(
        status, r'ProblemDetailsDto', 'status');
    BuiltValueNullFieldError.checkNotNull(code, r'ProblemDetailsDto', 'code');
    BuiltValueNullFieldError.checkNotNull(
        detail, r'ProblemDetailsDto', 'detail');
    BuiltValueNullFieldError.checkNotNull(
        requestId, r'ProblemDetailsDto', 'requestId');
  }

  @override
  ProblemDetailsDto rebuild(void Function(ProblemDetailsDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ProblemDetailsDtoBuilder toBuilder() =>
      new ProblemDetailsDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ProblemDetailsDto &&
        type == other.type &&
        title == other.title &&
        status == other.status &&
        code == other.code &&
        detail == other.detail &&
        requestId == other.requestId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, code.hashCode);
    _$hash = $jc(_$hash, detail.hashCode);
    _$hash = $jc(_$hash, requestId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ProblemDetailsDto')
          ..add('type', type)
          ..add('title', title)
          ..add('status', status)
          ..add('code', code)
          ..add('detail', detail)
          ..add('requestId', requestId))
        .toString();
  }
}

class ProblemDetailsDtoBuilder
    implements Builder<ProblemDetailsDto, ProblemDetailsDtoBuilder> {
  _$ProblemDetailsDto? _$v;

  String? _type;
  String? get type => _$this._type;
  set type(String? type) => _$this._type = type;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  num? _status;
  num? get status => _$this._status;
  set status(num? status) => _$this._status = status;

  String? _code;
  String? get code => _$this._code;
  set code(String? code) => _$this._code = code;

  String? _detail;
  String? get detail => _$this._detail;
  set detail(String? detail) => _$this._detail = detail;

  String? _requestId;
  String? get requestId => _$this._requestId;
  set requestId(String? requestId) => _$this._requestId = requestId;

  ProblemDetailsDtoBuilder() {
    ProblemDetailsDto._defaults(this);
  }

  ProblemDetailsDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _type = $v.type;
      _title = $v.title;
      _status = $v.status;
      _code = $v.code;
      _detail = $v.detail;
      _requestId = $v.requestId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ProblemDetailsDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$ProblemDetailsDto;
  }

  @override
  void update(void Function(ProblemDetailsDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ProblemDetailsDto build() => _build();

  _$ProblemDetailsDto _build() {
    final _$result = _$v ??
        new _$ProblemDetailsDto._(
            type: BuiltValueNullFieldError.checkNotNull(
                type, r'ProblemDetailsDto', 'type'),
            title: BuiltValueNullFieldError.checkNotNull(
                title, r'ProblemDetailsDto', 'title'),
            status: BuiltValueNullFieldError.checkNotNull(
                status, r'ProblemDetailsDto', 'status'),
            code: BuiltValueNullFieldError.checkNotNull(
                code, r'ProblemDetailsDto', 'code'),
            detail: BuiltValueNullFieldError.checkNotNull(
                detail, r'ProblemDetailsDto', 'detail'),
            requestId: BuiltValueNullFieldError.checkNotNull(
                requestId, r'ProblemDetailsDto', 'requestId'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
