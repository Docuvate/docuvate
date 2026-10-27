// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_user_list_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminUserListResponseDto extends AdminUserListResponseDto {
  @override
  final BuiltList<AdminUserResponseDto> users;
  @override
  final String nextCursor;
  @override
  final bool hasMore;
  @override
  final num total;

  factory _$AdminUserListResponseDto(
          [void Function(AdminUserListResponseDtoBuilder)? updates]) =>
      (new AdminUserListResponseDtoBuilder()..update(updates))._build();

  _$AdminUserListResponseDto._(
      {required this.users,
      required this.nextCursor,
      required this.hasMore,
      required this.total})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        users, r'AdminUserListResponseDto', 'users');
    BuiltValueNullFieldError.checkNotNull(
        nextCursor, r'AdminUserListResponseDto', 'nextCursor');
    BuiltValueNullFieldError.checkNotNull(
        hasMore, r'AdminUserListResponseDto', 'hasMore');
    BuiltValueNullFieldError.checkNotNull(
        total, r'AdminUserListResponseDto', 'total');
  }

  @override
  AdminUserListResponseDto rebuild(
          void Function(AdminUserListResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminUserListResponseDtoBuilder toBuilder() =>
      new AdminUserListResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminUserListResponseDto &&
        users == other.users &&
        nextCursor == other.nextCursor &&
        hasMore == other.hasMore &&
        total == other.total;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, users.hashCode);
    _$hash = $jc(_$hash, nextCursor.hashCode);
    _$hash = $jc(_$hash, hasMore.hashCode);
    _$hash = $jc(_$hash, total.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AdminUserListResponseDto')
          ..add('users', users)
          ..add('nextCursor', nextCursor)
          ..add('hasMore', hasMore)
          ..add('total', total))
        .toString();
  }
}

class AdminUserListResponseDtoBuilder
    implements
        Builder<AdminUserListResponseDto, AdminUserListResponseDtoBuilder> {
  _$AdminUserListResponseDto? _$v;

  ListBuilder<AdminUserResponseDto>? _users;
  ListBuilder<AdminUserResponseDto> get users =>
      _$this._users ??= new ListBuilder<AdminUserResponseDto>();
  set users(ListBuilder<AdminUserResponseDto>? users) => _$this._users = users;

  String? _nextCursor;
  String? get nextCursor => _$this._nextCursor;
  set nextCursor(String? nextCursor) => _$this._nextCursor = nextCursor;

  bool? _hasMore;
  bool? get hasMore => _$this._hasMore;
  set hasMore(bool? hasMore) => _$this._hasMore = hasMore;

  num? _total;
  num? get total => _$this._total;
  set total(num? total) => _$this._total = total;

  AdminUserListResponseDtoBuilder() {
    AdminUserListResponseDto._defaults(this);
  }

  AdminUserListResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _users = $v.users.toBuilder();
      _nextCursor = $v.nextCursor;
      _hasMore = $v.hasMore;
      _total = $v.total;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminUserListResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$AdminUserListResponseDto;
  }

  @override
  void update(void Function(AdminUserListResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminUserListResponseDto build() => _build();

  _$AdminUserListResponseDto _build() {
    _$AdminUserListResponseDto _$result;
    try {
      _$result = _$v ??
          new _$AdminUserListResponseDto._(
              users: users.build(),
              nextCursor: BuiltValueNullFieldError.checkNotNull(
                  nextCursor, r'AdminUserListResponseDto', 'nextCursor'),
              hasMore: BuiltValueNullFieldError.checkNotNull(
                  hasMore, r'AdminUserListResponseDto', 'hasMore'),
              total: BuiltValueNullFieldError.checkNotNull(
                  total, r'AdminUserListResponseDto', 'total'));
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'users';
        users.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'AdminUserListResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
